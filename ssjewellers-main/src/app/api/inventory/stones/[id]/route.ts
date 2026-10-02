import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const updateStoneSchema = z.object({
  stoneId: z.string().optional(),
  type: z.string().optional(),
  shape: z.string().optional(),
  size: z.string().optional(),
  quantity: z.number().int().optional(),
  weightCarats: z.number().optional(),
  unit: z.string().optional(),
  purchaseCostPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  supplierId: z.string().optional().nullable(),
  usedQuantity: z.number().int().optional(),
  remainingQuantity: z.number().int().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/inventory/stones/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('inventory:read')
    const { id } = await params

    const stone = await db.stoneItem.findUnique({
      where: { id },
      include: { supplier: { select: { id: true, name: true } } },
    })

    if (!stone) return errorResponse('Stone item not found', 404)
    return jsonResponse({ stone })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch stone item', 500)
  }
}

// PATCH /api/inventory/stones/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('inventory:write')
    const { id } = await params
    const body = await request.json()
    const parsed = updateStoneSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid stone data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.stoneItem.findUnique({ where: { id } })
    if (!existing) return errorResponse('Stone item not found', 404)

    const updateData: Record<string, unknown> = {}
    if (parsed.data.stoneId !== undefined) updateData.stoneId = parsed.data.stoneId
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type
    if (parsed.data.shape !== undefined) updateData.shape = parsed.data.shape
    if (parsed.data.size !== undefined) updateData.size = parsed.data.size
    if (parsed.data.quantity !== undefined) updateData.quantity = parsed.data.quantity
    if (parsed.data.weightCarats !== undefined) updateData.weightCarats = parsed.data.weightCarats
    if (parsed.data.unit !== undefined) updateData.unit = parsed.data.unit
    if (parsed.data.purchaseCostPaise !== undefined) updateData.purchaseCostPaise = parsed.data.purchaseCostPaise
    if (parsed.data.supplierId !== undefined) updateData.supplierId = parsed.data.supplierId
    if (parsed.data.usedQuantity !== undefined) updateData.usedQuantity = parsed.data.usedQuantity
    if (parsed.data.remainingQuantity !== undefined) updateData.remainingQuantity = parsed.data.remainingQuantity

    const updated = await db.stoneItem.update({
      where: { id },
      data: updateData,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE_STONE',
        entity: 'StoneItem',
        entityId: id,
        details: `Updated stone item ${existing.stoneId}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, stone: updated })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update stone item', 400)
  }
}

// DELETE /api/inventory/stones/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('inventory:write')
    const { id } = await params
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.stoneItem.findUnique({ where: { id } })
    if (!existing) return errorResponse('Stone item not found', 404)

    await db.stoneItem.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'DELETE_STONE',
        entity: 'StoneItem',
        entityId: id,
        details: `Deleted stone item ${existing.stoneId}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, message: 'Stone item deleted successfully' })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to delete stone item', 400)
  }
}
