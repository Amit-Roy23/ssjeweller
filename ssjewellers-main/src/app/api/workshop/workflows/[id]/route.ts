import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/workshop/workflows/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('workshop:create')
    const { id } = await params
    const body = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.workflow.findUnique({ where: { id } })
    if (!existing) return errorResponse('Workflow not found', 404)

    const updated = await db.workflow.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        active: body.active,
      },
      include: {
        steps: { orderBy: { order: 'asc' } },
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE_WORKFLOW',
        entity: 'Workflow',
        entityId: id,
        details: `Updated workflow ${updated.name}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, workflow: updated })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update workflow', 400)
  }
}

// DELETE /api/workshop/workflows/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('workshop:create')
    const { id } = await params
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.workflow.findUnique({ where: { id } })
    if (!existing) return errorResponse('Workflow not found', 404)

    await db.workflow.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'DELETE_WORKFLOW',
        entity: 'Workflow',
        entityId: id,
        details: `Deleted workflow ${existing.name}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, message: 'Workflow deleted successfully' })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to delete workflow', 400)
  }
}
