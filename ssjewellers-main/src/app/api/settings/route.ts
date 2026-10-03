import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const updateSettingsSchema = z.object({
  shopName: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().or(z.literal('')).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  defaultGstRate: z.coerce.number().optional(),
  defaultGstRateBps: z.coerce.number().int().optional(),
  makingGstRate: z.coerce.number().optional(),
  makingGstRateBps: z.coerce.number().int().optional(),
  defaultGoldRate24K: z.coerce.number().optional(),
  defaultGoldRate24KPaise: z.union([z.number(), z.string(), z.bigint()]).optional(),
  defaultSilverRate: z.coerce.number().optional(),
  defaultSilverRatePaisePerKg: z.union([z.number(), z.string(), z.bigint()]).optional(),
  branch: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  invoicePrefix: z.string().optional().nullable(),
  purchasePrefix: z.string().optional().nullable(),
  workOrderPrefix: z.string().optional().nullable(),
  customerPrefix: z.string().optional().nullable(),
  invoiceFooter: z.string().optional().nullable(),
  termsConditions: z.string().optional().nullable(),
})

function normalizeSettings(settings: any) {
  if (!settings) return null
  const goldRate24K = settings.defaultGoldRate24KPaise != null ? Number(settings.defaultGoldRate24KPaise) / 100 : 7250
  const silverRate = settings.defaultSilverRatePaisePerKg != null ? Number(settings.defaultSilverRatePaisePerKg) / 100 : 94500
  const gstRate = settings.defaultGstRateBps != null ? Number(settings.defaultGstRateBps) / 100 : 3
  const makingGstRate = settings.makingGstRateBps != null ? Number(settings.makingGstRateBps) / 100 : 5

  return {
    ...settings,
    defaultGoldRate24K: goldRate24K,
    defaultSilverRate: silverRate,
    defaultGstRate: gstRate,
    makingGstRate: makingGstRate,
  }
}

// GET /api/settings - Get master shop settings
export async function GET() {
  try {
    let settings = await db.shopSetting.findUnique({
      where: { id: 'default' },
    })

    if (!settings) {
      settings = await db.shopSetting.create({
        data: {
          id: 'default',
          shopName: 'S.S JEWELLERY',
          ownerName: 'Suresh Shah',
          phone: '+91 98250 12345',
          email: 'contact@ssjewellery.in',
          address: 'Shop 12, Manek Chowk, Ring Road',
          city: 'Surat',
          pincode: '395003',
          gstin: '24ABCDE1234F1Z5',
          pan: 'ABCDE1234F',
          defaultGstRateBps: 300,
          makingGstRateBps: 500,
          defaultGoldRate24KPaise: 725000n,
          defaultSilverRatePaisePerKg: 9450000n,
          branch: 'Main Branch',
          currency: '₹',
          invoicePrefix: 'INV-2026',
          purchasePrefix: 'PUR-2026',
          workOrderPrefix: 'WF',
          customerPrefix: 'CUST',
          invoiceFooter: 'Thank you for your business! Visit again.',
          termsConditions:
            '1. Goods once sold will not be taken back.\n2. All disputes subject to Surat jurisdiction.\n3. Gold rate applicable as on date of bill.',
        },
      })
    }

    return jsonResponse({ settings: normalizeSettings(settings) })
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
    const data = parsed.data

    const updateData: Record<string, any> = {}

    if (data.shopName !== undefined) updateData.shopName = data.shopName.trim()
    if (data.ownerName !== undefined) updateData.ownerName = data.ownerName.trim()
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || ''
    if (data.email !== undefined) updateData.email = data.email?.trim() || ''
    if (data.address !== undefined) updateData.address = data.address?.trim() || ''
    if (data.city !== undefined) updateData.city = data.city?.trim() || ''
    if (data.pincode !== undefined) updateData.pincode = data.pincode?.trim() || ''
    if (data.gstin !== undefined) updateData.gstin = data.gstin?.trim() || ''
    if (data.pan !== undefined) updateData.pan = data.pan?.trim() || ''
    if (data.branch !== undefined) updateData.branch = data.branch?.trim() || ''
    if (data.currency !== undefined) updateData.currency = data.currency?.trim() || '₹'
    if (data.invoicePrefix !== undefined) updateData.invoicePrefix = data.invoicePrefix?.trim() || 'INV-2026'
    if (data.purchasePrefix !== undefined) updateData.purchasePrefix = data.purchasePrefix?.trim() || 'PUR-2026'
    if (data.workOrderPrefix !== undefined) updateData.workOrderPrefix = data.workOrderPrefix?.trim() || 'WF'
    if (data.customerPrefix !== undefined) updateData.customerPrefix = data.customerPrefix?.trim() || 'CUST'
    if (data.invoiceFooter !== undefined) updateData.invoiceFooter = data.invoiceFooter?.trim() || ''
    if (data.termsConditions !== undefined) updateData.termsConditions = data.termsConditions?.trim() || ''

    // Rate calculations with priority for user-friendly unit fields
    if (data.defaultGoldRate24K !== undefined) {
      updateData.defaultGoldRate24KPaise = BigInt(Math.round(Number(data.defaultGoldRate24K) * 100))
    } else if (data.defaultGoldRate24KPaise !== undefined) {
      updateData.defaultGoldRate24KPaise = BigInt(data.defaultGoldRate24KPaise)
    }

    if (data.defaultSilverRate !== undefined) {
      updateData.defaultSilverRatePaisePerKg = BigInt(Math.round(Number(data.defaultSilverRate) * 100))
    } else if (data.defaultSilverRatePaisePerKg !== undefined) {
      updateData.defaultSilverRatePaisePerKg = BigInt(data.defaultSilverRatePaisePerKg)
    }

    if (data.defaultGstRate !== undefined) {
      updateData.defaultGstRateBps = Math.round(Number(data.defaultGstRate) * 100)
    } else if (data.defaultGstRateBps !== undefined) {
      updateData.defaultGstRateBps = Number(data.defaultGstRateBps)
    }

    if (data.makingGstRate !== undefined) {
      updateData.makingGstRateBps = Math.round(Number(data.makingGstRate) * 100)
    } else if (data.makingGstRateBps !== undefined) {
      updateData.makingGstRateBps = Number(data.makingGstRateBps)
    }

    const updated = await db.shopSetting.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        ...updateData,
      },
    })

    // Synchronize Admin user account name with ownerName
    if (updateData.ownerName) {
      const cleanOwnerName = updateData.ownerName

      // 1. Update current user if they are an ADMIN
      if (user.role === 'ADMIN') {
        await db.user.update({
          where: { id: user.id },
          data: { name: cleanOwnerName },
        })
      }

      // 2. Also ensure all ADMIN role accounts & default super admin account are synced
      await db.user.updateMany({
        where: {
          OR: [
            { role: 'ADMIN' },
            { username: 'admin' },
            { id: 'usr-admin' },
          ],
        },
        data: {
          name: cleanOwnerName,
        },
      })
    }

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: updateData.ownerName || user.name,
        action: 'UPDATE_SETTINGS',
        entity: 'ShopSetting',
        entityId: 'default',
        details: `Updated shop settings (Owner: ${updateData.ownerName || 'unchanged'})`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, settings: normalizeSettings(updated) })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update settings', 400)
  }
}
