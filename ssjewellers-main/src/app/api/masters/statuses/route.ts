import { db } from '@/lib/db'
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
