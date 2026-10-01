import { db } from '@/lib/db'
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
