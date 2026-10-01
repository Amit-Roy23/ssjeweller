import { db } from '@/lib/db'
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
