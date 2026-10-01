import { NextRequest } from 'next/server'
import { z } from 'zod'
import { MetalType, WorkPriority, WorkStatusValue } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { WorkshopService } from '@/lib/services/workshop.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

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
  try {
    await requirePermission('workshop:read')
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') as WorkStatusValue | null
    const priority = searchParams.get('priority') as WorkPriority | null
    const assignedToId = searchParams.get('assignedToId')
    const search = searchParams.get('search') || ''

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

    const workOrders = await db.workOrder.findMany({
      where,
      include: {
        steps: { orderBy: { order: 'asc' } },
        assignedTo: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return jsonResponse({ workOrders })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch work orders', 500)
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
