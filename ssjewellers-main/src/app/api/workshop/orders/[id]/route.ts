import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/workshop/orders/[id] - Get work order detail
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('workshop:read')
    const { id } = await params

    const workOrder = await db.workOrder.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: { assignedTo: { select: { id: true, name: true, username: true } } },
        },
        history: { orderBy: { timestamp: 'desc' } },
        wastageRecords: true,
        qualityChecks: {
          include: { checkedBy: { select: { id: true, name: true, username: true } } },
        },
        assignedTo: { select: { id: true, name: true, username: true } },
      },
    })

    if (!workOrder) return errorResponse('Work order not found', 404)

    return jsonResponse({ workOrder })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch work order', 500)
  }
}
