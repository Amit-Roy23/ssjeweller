import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/sales/[id] - Get sale detail
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('sales:read')
    const { id } = await params

    const sale = await db.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, productCode: true, barcode: true, imageColor: true } },
          },
        },
        payments: true,
        returns: true,
        oldGoldExchanges: true,
        billedBy: { select: { id: true, name: true, username: true } },
        cancelledBy: { select: { id: true, name: true, username: true } },
      },
    })

    if (!sale) {
      return errorResponse('Sale invoice not found', 404)
    }

    return jsonResponse({ sale })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch sale invoice', 500)
  }
}
