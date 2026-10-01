import { NextRequest } from 'next/server'
import { z } from 'zod'
import { MetalType, PaymentMode, SaleStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { SalesService } from '@/lib/services/sales.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const saleItemSchema = z.object({
  productId: z.string().optional().nullable(),
  productCode: z.string().optional().nullable(),
  name: z.string().min(1, 'Item name is required'),
  hsn: z.string().default('7113'),
  metal: z.nativeEnum(MetalType).default(MetalType.GOLD),
  purity: z.string().min(1, 'Purity is required'),
  grossWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  netWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  stoneWeightMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v ? BigInt(v) : 0n)),
  ratePaisePerGram: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  makingAmountPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v ? BigInt(v) : 0n)),
  stoneAmountPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v ? BigInt(v) : 0n)),
  otherChargesPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v ? BigInt(v) : 0n)),
  discountPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v ? BigInt(v) : 0n)),
  gstRateBps: z.number().default(300),
  quantity: z.number().int().positive().default(1),
})

const createSaleSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  customerAddress: z.string().optional().nullable(),
  customerGstin: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1, 'At least one line item is required'),
  paymentMode: z.nativeEnum(PaymentMode).default(PaymentMode.CASH),
  paidAmountPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  oldGoldAdjustmentPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : 0n)),
  paymentRef: z.string().optional().nullable(),
  branch: z.string().default('Main Branch'),
  idempotencyKey: z.string().optional().nullable(),
})

// GET /api/sales - List sales
export async function GET(request: NextRequest) {
  try {
    await requirePermission('sales:read')
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') as SaleStatus | null
    const customerId = searchParams.get('customerId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const skip = (page - 1) * limit

    const where = {
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNo: { contains: search, mode: 'insensitive' as const } },
              { customerName: { contains: search, mode: 'insensitive' as const } },
              { customerPhone: { contains: search } },
            ],
          }
        : {}),
    }

    const [sales, totalCount] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          items: true,
          payments: true,
          billedBy: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.sale.count({ where }),
    ])

    return jsonResponse({
      sales,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch sales', 500)
  }
}

// POST /api/sales - Create sale invoice
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('sales:create')
    const body = await request.json()
    const parsed = createSaleSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid sale data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const sale = await SalesService.createSale({
      ...parsed.data,
      billedById: user.id,
      billedByName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, sale }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create sale', 400)
  }
}
