import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/masters/purities/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('settings:update')
    const { id } = await params
    const body = await request.json()

    const purity = await db.purity.update({
      where: { id },
      data: {
        label: body.label,
        percentage: body.percentage !== undefined ? Number(body.percentage) : undefined,
        metal: body.metal,
        order: body.order !== undefined ? Number(body.order) : undefined,
        active: body.active !== undefined ? body.active : undefined,
      },
    })

    return jsonResponse({ success: true, purity })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update purity', 400)
  }
}

// DELETE /api/masters/purities/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('settings:update')
    const { id } = await params

    await db.purity.delete({ where: { id } })
    return jsonResponse({ success: true, message: 'Purity deleted' })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to delete purity', 400)
  }
}
