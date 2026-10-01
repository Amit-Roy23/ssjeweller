import { NextRequest } from 'next/server'
import { StockItemType } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/inventory/movements - List stock movements
export async function GET(request: NextRequest) {
  try {
    await requirePermission('inventory:read')
    const { searchParams } = new URL(request.url)

    const itemType = searchParams.get('itemType') as StockItemType | null
    const itemId = searchParams.get('itemId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const where = {
      ...(itemType ? { itemType } : {}),
      ...(itemId ? { itemId } : {}),
    }

    const movements = await db.stockMovement.findMany({
      where,
      include: {
        performedBy: { select: { id: true, name: true, username: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    return jsonResponse({ movements })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch movements', 500)
  }
}
