import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/masters/categories - List master product categories
export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    })

    return jsonResponse({ categories })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch categories', 500)
  }
}

// POST /api/masters/categories - Create category
export async function POST(request: Request) {
  try {
    await requirePermission('settings:update')
    const body = await request.json()
    if (!body.name) return errorResponse('Category name is required', 400)

    const category = await db.category.create({
      data: {
        name: body.name,
        order: body.order ? Number(body.order) : 0,
        active: body.active !== undefined ? body.active : true,
      },
    })

    return jsonResponse({ success: true, category }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create category', 400)
  }
}
