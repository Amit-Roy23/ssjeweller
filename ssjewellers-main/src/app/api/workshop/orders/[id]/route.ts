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

// PATCH /api/workshop/orders/[id] - Update work order
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('workshop:create')
    const { id } = await params
    const body = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.workOrder.findUnique({ where: { id } })
    if (!existing) return errorResponse('Work order not found', 404)

    const updated = await db.workOrder.update({
      where: { id },
      data: {
        productName: body.productName,
        priority: body.priority,
        status: body.status,
        assignedToId: body.assignedToId,
        notes: body.notes,
        expectedCompletion: body.expectedCompletion || body.dueDate ? new Date(body.expectedCompletion || body.dueDate) : undefined,
      },
      include: {
        steps: { orderBy: { order: 'asc' } },
        history: { orderBy: { timestamp: 'desc' } },
        assignedTo: { select: { id: true, name: true, username: true } },
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE_WORK_ORDER',
        entity: 'WorkOrder',
        entityId: id,
        details: `Updated work order ${existing.workId}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, workOrder: updated })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update work order', 400)
  }
}

// DELETE /api/workshop/orders/[id] - Delete work order
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('workshop:create')
    const { id } = await params
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.workOrder.findUnique({ where: { id } })
    if (!existing) return errorResponse('Work order not found', 404)

    await db.workOrder.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'DELETE_WORK_ORDER',
        entity: 'WorkOrder',
        entityId: id,
        details: `Deleted work order ${existing.workId}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, message: 'Work order deleted successfully' })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to delete work order', 400)
  }
}
