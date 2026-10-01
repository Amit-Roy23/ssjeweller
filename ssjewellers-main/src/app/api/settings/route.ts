import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const updateSettingsSchema = z.object({
  shopName: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  defaultGstRateBps: z.number().int().optional(),
  makingGstRateBps: z.number().int().optional(),
  defaultGoldRate24KPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  defaultSilverRatePaisePerKg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  branch: z.string().optional(),
  currency: z.string().optional(),
  invoiceFooter: z.string().optional(),
  termsConditions: z.string().optional(),
})

// GET /api/settings - Get master shop settings
export async function GET() {
  try {
    const settings = await db.shopSetting.findUnique({
      where: { id: 'default' },
    })

    return jsonResponse({ settings })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch settings', 500)
  }
}

// PATCH /api/settings - Update master shop settings (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const user = await requirePermission('settings:update')
    const body = await request.json()
    const parsed = updateSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid settings data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const updated = await db.shopSetting.upsert({
      where: { id: 'default' },
      update: parsed.data,
      create: {
        id: 'default',
        ...parsed.data,
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE_SETTINGS',
        entity: 'ShopSetting',
        entityId: 'default',
        details: 'Updated shop settings',
        ipAddress,
      },
    })

    return jsonResponse({ success: true, settings: updated })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update settings', 400)
  }
}
