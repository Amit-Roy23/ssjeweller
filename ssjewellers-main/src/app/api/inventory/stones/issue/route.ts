import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth/guards'
import { InventoryService } from '@/lib/services/inventory.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const issueStoneSchema = z.object({
  stoneItemId: z.string().min(1, 'Stone lot ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  workId: z.string().min(1, 'Work Order ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('inventory:write')
    const body = await request.json()
    const parsed = issueStoneSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid issue data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const updatedStone = await InventoryService.issueStonesToWorkOrder(
      parsed.data.stoneItemId,
      parsed.data.quantity,
      parsed.data.workId,
      user.id,
      user.name,
      ipAddress
    )

    return jsonResponse({
      success: true,
      message: `Issued ${parsed.data.quantity} stones to ${parsed.data.workId}`,
      stoneItem: updatedStone,
    })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to issue stones', 400)
  }
}
