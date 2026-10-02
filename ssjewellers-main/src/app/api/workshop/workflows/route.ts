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

// POST /api/workshop/workflows - Create workflow template
export async function POST(request: Request) {
  try {
    const user = await requirePermission('workshop:create')
    const body = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (!body.name) return errorResponse('Workflow name is required', 400)

    const code = body.code || `wf-${body.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`

    const workflow = await db.$transaction(async (tx) => {
      const created = await tx.workflow.create({
        data: {
          code,
          name: body.name,
          description: body.description || null,
          active: true,
          steps: {
            create: (body.steps || []).map((s: { name: string; description?: string; defaultUserId?: string; estimatedHours?: number }, idx: number) => ({
              name: s.name,
              description: s.description || null,
              defaultUserId: s.defaultUserId || null,
              estimatedHours: s.estimatedHours ? Number(s.estimatedHours) : null,
              order: idx,
            })),
          },
        },
        include: {
          steps: { orderBy: { order: 'asc' } },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE_WORKFLOW',
          entity: 'Workflow',
          entityId: created.id,
          details: `Created workflow ${created.name}`,
          ipAddress,
        },
      })

      return created
    })

    return jsonResponse({ success: true, workflow }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create workflow', 400)
  }
}
