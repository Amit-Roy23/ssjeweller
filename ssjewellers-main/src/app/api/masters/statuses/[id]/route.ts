import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/masters/statuses/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('settings:update')
    const { id } = await params
    const body = await request.json()

    const status = await db.workStatus.update({
      where: { id },
      data: {
        label: body.label,
        color: body.color,
        order: body.order !== undefined ? Number(body.order) : undefined,
        active: body.active !== undefined ? body.active : undefined,
      },
    })

    return jsonResponse({ success: true, status })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update work status', 400)
  }
}

// DELETE /api/masters/statuses/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('settings:update')
    const { id } = await params

    await db.workStatus.delete({ where: { id } })
    return jsonResponse({ success: true, message: 'Work status deleted' })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to delete work status', 400)
  }
}
