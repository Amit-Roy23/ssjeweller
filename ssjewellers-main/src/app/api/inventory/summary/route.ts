import { requirePermission } from '@/lib/auth/guards'
import { InventoryService } from '@/lib/services/inventory.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/inventory/summary - Live inventory weight and valuation summary
export async function GET() {
  try {
    await requirePermission('inventory:read')

    const summary = await InventoryService.getInventorySummary()
    return jsonResponse({ summary })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch inventory summary', 500)
  }
}
