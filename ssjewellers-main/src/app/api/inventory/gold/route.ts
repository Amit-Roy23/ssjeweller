import { NextRequest } from 'next/server'
import { z } from 'zod'
import { MaterialType, MetalType, GoldStockStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { InventoryService } from '@/lib/services/inventory.service'
import { jsonResponse, errorResponse, RequestTimer } from '@/lib/api-helpers'

const createGoldStockSchema = z.object({
  stockId: z.string().min(1, 'Stock ID is required'),
  materialType: z.nativeEnum(MaterialType).default(MaterialType.GOLD_BAR),
  metal: z.nativeEnum(MetalType).default(MetalType.GOLD),
  purity: z.string().min(1, 'Purity is required'),
  karat: z.string().min(1, 'Karat is required'),
  grossWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  fineGoldWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  supplierId: z.string().optional().nullable(),
  purchaseDate: z.string().transform((v) => new Date(v)),
  purchaseRatePaisePerGram: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  purchaseValuePaise: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  currentLocation: z.string().default('Vault A'),
  status: z.nativeEnum(GoldStockStatus).default(GoldStockStatus.AVAILABLE),
  referenceNumber: z.string().optional().nullable(),
})

// GET /api/inventory/gold - List raw gold & bullion lots
export async function GET(request: NextRequest) {
  const timer = new RequestTimer()
  try {
    await requirePermission('inventory:read')
    const { searchParams } = new URL(request.url)

    const metal = searchParams.get('metal') as MetalType | null
    const status = searchParams.get('status') as GoldStockStatus | null
    const location = searchParams.get('location')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = searchParams.get('limit') ? Math.min(parseInt(searchParams.get('limit')!, 10), 100) : undefined
    const skip = limit ? (page - 1) * limit : undefined

    const where = {
      ...(metal ? { metal } : {}),
      ...(status ? { status } : {}),
      ...(location ? { currentLocation: location } : {}),
      ...(search
        ? {
            OR: [
              { stockId: { contains: search, mode: 'insensitive' as const } },
              { purity: { contains: search, mode: 'insensitive' as const } },
              { currentLocation: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [goldStocks, totalCount] = await timer.track(() =>
      Promise.all([
        db.goldStock.findMany({
          where,
          include: {
            supplier: { select: { id: true, name: true, supplierCode: true } },
          },
          orderBy: { createdAt: 'desc' },
          ...(limit ? { take: limit, skip } : {}),
        }),
        db.goldStock.count({ where }),
      ])
    )

    timer.log('GET', '/api/inventory/gold', 200)
    return jsonResponse(
      {
        goldStocks,
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
    timer.log('GET', '/api/inventory/gold', 500)
    return errorResponse((err as Error).message || 'Failed to fetch gold inventory', 500, undefined, timer)
  }
}

// POST /api/inventory/gold - Add raw gold lot
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('inventory:write')
    const body = await request.json()
    const parsed = createGoldStockSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid gold stock data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const stock = await InventoryService.createGoldStock({
      ...parsed.data,
      performedById: user.id,
      performedByName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, stock }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to add gold stock', 400)
  }
}
