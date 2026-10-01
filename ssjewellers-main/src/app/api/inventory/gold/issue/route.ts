import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth/guards'
import { InventoryService } from '@/lib/services/inventory.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const issueGoldSchema = z.object({
  goldStockId: z.string().min(1, 'Gold stock ID is required'),
  workId: z.string().min(1, 'Work Order ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('inventory:write')
    const body = await request.json()
    const parsed = issueGoldSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid issue data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const updatedStock = await InventoryService.issueGoldToWorkOrder(
      parsed.data.goldStockId,
      parsed.data.workId,
      user.id,
      user.name,
      ipAddress
    )

    return jsonResponse({
      success: true,
      message: `Issued gold to ${parsed.data.workId}`,
      goldStock: updatedStock,
    })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to issue gold', 400)
  }
}
