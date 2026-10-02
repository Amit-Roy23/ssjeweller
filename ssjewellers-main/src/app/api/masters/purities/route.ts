import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/masters/purities - List master purities
export async function GET() {
  try {
    const purities = await db.purity.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    })

    return jsonResponse({ purities })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch purities', 500)
  }
}

// POST /api/masters/purities - Create purity
export async function POST(request: Request) {
  try {
    await requirePermission('settings:update')
    const body = await request.json()
    if (!body.label || body.percentage === undefined) {
      return errorResponse('Purity label and percentage are required', 400)
    }

    const purity = await db.purity.create({
      data: {
        label: body.label,
        percentage: Number(body.percentage),
        metal: body.metal || 'GOLD',
        order: body.order !== undefined ? Number(body.order) : 0,
        active: body.active !== undefined ? body.active : true,
      },
    })

    return jsonResponse({ success: true, purity }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create purity', 400)
  }
}
