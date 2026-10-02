import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { InventoryService } from '@/lib/services/inventory.service'
import { jsonResponse, errorResponse, RequestTimer } from '@/lib/api-helpers'

const createStoneSchema = z.object({
  stoneId: z.string().min(1, 'Stone ID is required'),
  type: z.string().min(1, 'Stone type is required'),
  shape: z.string().min(1, 'Shape is required'),
  size: z.string().min(1, 'Size is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  weightCarats: z.number().positive('Carat weight must be positive'),
  unit: z.string().default('carat'),
  purchaseCostPaise: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  supplierId: z.string().optional().nullable(),
})

// GET /api/inventory/stones - List stone inventory
export async function GET(request: NextRequest) {
  const timer = new RequestTimer()
  try {
    await requirePermission('inventory:read')
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = searchParams.get('limit') ? Math.min(parseInt(searchParams.get('limit')!, 10), 100) : undefined
    const skip = limit ? (page - 1) * limit : undefined

    const where = search
      ? {
          OR: [
            { stoneId: { contains: search, mode: 'insensitive' as const } },
            { type: { contains: search, mode: 'insensitive' as const } },
            { shape: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [stones, totalCount] = await timer.track(() =>
      Promise.all([
        db.stoneItem.findMany({
          where,
          include: {
            supplier: { select: { id: true, name: true, supplierCode: true } },
          },
          orderBy: { createdAt: 'desc' },
          ...(limit ? { take: limit, skip } : {}),
        }),
        db.stoneItem.count({ where }),
      ])
    )

    timer.log('GET', '/api/inventory/stones', 200)
    return jsonResponse(
      {
        stones,
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
    timer.log('GET', '/api/inventory/stones', 500)
    return errorResponse((err as Error).message || 'Failed to fetch stone inventory', 500, undefined, timer)
  }
}

// POST /api/inventory/stones - Add stone lot
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('inventory:write')
    const body = await request.json()
    const parsed = createStoneSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid stone data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const stone = await InventoryService.createStoneItem({
      ...parsed.data,
      performedById: user.id,
      performedByName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, stone }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to add stone item', 400)
  }
}
