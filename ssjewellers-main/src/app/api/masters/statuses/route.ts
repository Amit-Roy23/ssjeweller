import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/masters/statuses - List master work statuses
export async function GET() {
  try {
    const statuses = await db.workStatus.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    })

    return jsonResponse({ statuses })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch work statuses', 500)
  }
}

// POST /api/masters/statuses - Create work status
export async function POST(request: Request) {
  try {
    await requirePermission('settings:update')
    const body = await request.json()
    if (!body.value || !body.label) {
      return errorResponse('Status value and label are required', 400)
    }

    const status = await db.workStatus.create({
      data: {
        value: body.value,
        label: body.label,
        color: body.color || 'bg-slate-100 text-slate-700',
        order: body.order !== undefined ? Number(body.order) : 0,
        active: body.active !== undefined ? body.active : true,
      },
    })

    return jsonResponse({ success: true, status }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create work status', 400)
  }
}
