import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/masters/categories/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('settings:update')
    const { id } = await params
    const body = await request.json()

    const category = await db.category.update({
      where: { id },
      data: {
        name: body.name,
        order: body.order !== undefined ? Number(body.order) : undefined,
        active: body.active !== undefined ? body.active : undefined,
      },
    })

    return jsonResponse({ success: true, category })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update category', 400)
  }
}

// DELETE /api/masters/categories/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('settings:update')
    const { id } = await params

    await db.category.delete({ where: { id } })
    return jsonResponse({ success: true, message: 'Category deleted' })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to delete category', 400)
  }
}
