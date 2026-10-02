import { NextRequest } from 'next/server'
import { z } from 'zod'
import { MetalType } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { InventoryService } from '@/lib/services/inventory.service'
import { jsonResponse, errorResponse, RequestTimer } from '@/lib/api-helpers'

const createProductSchema = z.object({
  productCode: z.string().min(1, 'Product code is required'),
  barcode: z.string().min(1, 'Barcode is required'),
  name: z.string().min(1, 'Product name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional().nullable(),
  designNumber: z.string().optional().nullable(),
  metal: z.nativeEnum(MetalType).default(MetalType.GOLD),
  purity: z.string().min(1, 'Purity is required'),
  grossWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  netWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  stoneWeightMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v ? BigInt(v) : 0n)),
  wastageMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v ? BigInt(v) : 0n)),
  makingChargePaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v ? BigInt(v) : 0n)),
  otherChargesPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v ? BigInt(v) : 0n)),
  gstRateBps: z.number().default(300),
  sellingPricePaise: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  costPricePaise: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  stock: z.number().int().nonnegative().default(1),
  hsnCode: z.string().default('7113'),
  imageColor: z.string().optional().nullable(),
})

// GET /api/inventory/products - List products
export async function GET(request: NextRequest) {
  const timer = new RequestTimer()
  try {
    await requirePermission('inventory:read')
    const { searchParams } = new URL(request.url)

    const categoryId = searchParams.get('categoryId')
    const metal = searchParams.get('metal') as MetalType | null
    const inStockOnly = searchParams.get('inStock') === 'true'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = searchParams.get('limit') ? Math.min(parseInt(searchParams.get('limit')!, 10), 100) : undefined
    const skip = limit ? (page - 1) * limit : undefined

    const where = {
      ...(categoryId ? { categoryId } : {}),
      ...(metal ? { metal } : {}),
      ...(inStockOnly ? { stock: { gt: 0 } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { productCode: { contains: search, mode: 'insensitive' as const } },
              { barcode: { contains: search } },
            ],
          }
        : {}),
    }

    const [products, totalCount] = await timer.track(() =>
      Promise.all([
        db.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          ...(limit ? { take: limit, skip } : {}),
        }),
        db.product.count({ where }),
      ])
    )

    timer.log('GET', '/api/inventory/products', 200)
    return jsonResponse(
      {
        products,
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
    timer.log('GET', '/api/inventory/products', 500)
    return errorResponse((err as Error).message || 'Failed to fetch products', 500, undefined, timer)
  }
}

// POST /api/inventory/products - Create product
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('inventory:write')
    const body = await request.json()
    const parsed = createProductSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid product data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const product = await InventoryService.createProduct({
      ...parsed.data,
      performedById: user.id,
      performedByName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, product }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create product', 400)
  }
}
