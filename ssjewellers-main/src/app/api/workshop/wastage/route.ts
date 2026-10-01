import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/workshop/wastage - List wastage records
export async function GET() {
  try {
    await requirePermission('workshop:read')

    const wastages = await db.wastageRecord.findMany({
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    })

    return jsonResponse({ wastages })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch wastage records', 500)
  }
}
