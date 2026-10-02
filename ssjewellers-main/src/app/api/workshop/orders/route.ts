import { NextRequest } from 'next/server'
import { z } from 'zod'
import { MetalType, WorkPriority, WorkStatusValue } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { WorkshopService } from '@/lib/services/workshop.service'
import { jsonResponse, errorResponse, RequestTimer } from '@/lib/api-helpers'

const createWorkOrderSchema = z.object({
  productCode: z.string().optional().nullable(),
  productName: z.string().min(1, 'Product name is required'),
  customerName: z.string().optional().nullable(),
  workflowId: z.string().min(1, 'Workflow is required'),
  grossWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  purity: z.string().min(1, 'Purity is required'),
  metal: z.nativeEnum(MetalType).default(MetalType.GOLD),
  priority: z.nativeEnum(WorkPriority).default(WorkPriority.NORMAL),
  expectedCompletion: z.string().transform((v) => new Date(v)),
  notes: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
})

// GET /api/workshop/orders - List work orders
export async function GET(request: NextRequest) {
  const timer = new RequestTimer()
  try {
    await requirePermission('workshop:read')
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') as WorkStatusValue | null
    const priority = searchParams.get('priority') as WorkPriority | null
    const assignedToId = searchParams.get('assignedToId')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = searchParams.get('limit') ? Math.min(parseInt(searchParams.get('limit')!, 10), 100) : undefined
    const skip = limit ? (page - 1) * limit : undefined

    const where = {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assignedToId ? { assignedToId } : {}),
      ...(search
        ? {
            OR: [
              { workId: { contains: search, mode: 'insensitive' as const } },
              { productName: { contains: search, mode: 'insensitive' as const } },
              { customerName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [workOrders, totalCount] = await timer.track(() =>
      Promise.all([
        db.workOrder.findMany({
          where,
          include: {
            steps: { orderBy: { order: 'asc' } },
            history: { orderBy: { timestamp: 'desc' } },
            qualityChecks: true,
            wastageRecords: true,
            workflow: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true, username: true } },
          },
          orderBy: { createdAt: 'desc' },
          ...(limit ? { take: limit, skip } : {}),
        }),
        db.workOrder.count({ where }),
      ])
    )

    timer.log('GET', '/api/workshop/orders', 200)
    return jsonResponse(
      {
        workOrders,
        pagination: {
          totalCount,
          page,
          limit: limit || totalCount,
          totalPages: limit ? Math.ceil(totalCount / limit) : 1,
        },
      },
      undefined,
      timer
    )
  } catch (err: unknown) {
    timer.log('GET', '/api/workshop/orders', 500)
    return errorResponse((err as Error).message || 'Failed to fetch work orders', 500, undefined, timer)
  }
}

// POST /api/workshop/orders - Create work order
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('workshop:create')
    const body = await request.json()
    const parsed = createWorkOrderSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid work order data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const workOrder = await WorkshopService.createWorkOrder({
      ...parsed.data,
      createdByUserId: user.id,
      createdByUserName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, workOrder }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create work order', 400)
  }
}
