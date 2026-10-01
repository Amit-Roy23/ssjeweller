import { NextRequest } from 'next/server'
import { z } from 'zod'
import { StockItemType, AdjustmentType, AdjustmentReason } from '@prisma/client'
import { requirePermission } from '@/lib/auth/guards'
import { InventoryService } from '@/lib/services/inventory.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const adjustSchema = z.object({
  itemType: z.nativeEnum(StockItemType),
  itemId: z.string().min(1, 'Item ID is required'),
  itemName: z.string().min(1, 'Item Name is required'),
  adjustmentType: z.nativeEnum(AdjustmentType),
  weightMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v ? BigInt(v) : null)),
  quantity: z.number().int().optional().nullable(),
  reason: z.nativeEnum(AdjustmentReason),
  remarks: z.string().min(3, 'Remarks are required'),
})

// POST /api/inventory/adjustments - Record stock adjustment
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('inventory:adjust')
    const body = await request.json()
    const parsed = adjustSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid adjustment data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const adjustment = await InventoryService.adjustStock({
      ...parsed.data,
      performedById: user.id,
      performedByName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, adjustment }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to adjust stock', 400)
  }
}
