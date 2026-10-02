import { NextRequest } from 'next/server'
import { z } from 'zod'
import { GoldStockStatus, MetalType, MaterialType } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const updateGoldSchema = z.object({
  stockId: z.string().optional(),
  metal: z.nativeEnum(MetalType).optional(),
  materialType: z.nativeEnum(MaterialType).optional(),
  purity: z.string().optional(),
  karat: z.string().optional(),
  grossWeightMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  fineGoldWeightMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  purchaseRatePaisePerGram: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  purchaseValuePaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  supplierId: z.string().optional().nullable(),
  status: z.nativeEnum(GoldStockStatus).optional(),
  currentLocation: z.string().optional(),
  referenceNumber: z.string().optional().nullable(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/inventory/gold/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('inventory:read')
    const { id } = await params

    const stock = await db.goldStock.findUnique({
      where: { id },
      include: { supplier: { select: { id: true, name: true } } },
    })

    if (!stock) return errorResponse('Gold stock item not found', 404)
    return jsonResponse({ stock })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch gold stock', 500)
  }
}

// PATCH /api/inventory/gold/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('inventory:write')
    const { id } = await params
    const body = await request.json()
    const parsed = updateGoldSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid gold stock data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.goldStock.findUnique({ where: { id } })
    if (!existing) return errorResponse('Gold stock item not found', 404)

    const updated = await db.goldStock.update({
      where: { id },
      data: parsed.data,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE_GOLD_STOCK',
        entity: 'GoldStock',
        entityId: id,
        details: `Updated gold stock ${existing.stockId}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, stock: updated })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update gold stock', 400)
  }
}

// DELETE /api/inventory/gold/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('inventory:write')
    const { id } = await params
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.goldStock.findUnique({ where: { id } })
    if (!existing) return errorResponse('Gold stock item not found', 404)

    await db.goldStock.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'DELETE_GOLD_STOCK',
        entity: 'GoldStock',
        entityId: id,
        details: `Deleted gold stock lot ${existing.stockId}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, message: 'Gold stock lot deleted successfully' })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to delete gold stock', 400)
  }
}
