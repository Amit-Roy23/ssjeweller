import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/workshop/workflows - List workflow templates
export async function GET() {
  try {
    await requirePermission('workshop:read')

    const workflows = await db.workflow.findMany({
      where: { active: true },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: { defaultUser: { select: { id: true, name: true, username: true } } },
        },
      },
    })

    return jsonResponse({ workflows })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch workflows', 500)
  }
}
