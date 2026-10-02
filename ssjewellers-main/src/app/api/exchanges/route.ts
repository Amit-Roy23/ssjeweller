import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ExchangeType } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { ExchangeService } from '@/lib/services/exchange.service'
import { jsonResponse, errorResponse, RequestTimer } from '@/lib/api-helpers'

const createExchangeSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  type: z.nativeEnum(ExchangeType).default(ExchangeType.BUY),
  itemDescription: z.string().min(1, 'Item description is required'),
  grossWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  netWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  karat: z.string().min(1, 'Karat is required'),
  touchBps: z.number().int().min(1).max(10000), // e.g. 9160 for 91.6%
  ratePaisePerGram: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  adjustedAgainstSaleId: z.string().optional().nullable(),
  adjustedAgainstInvoice: z.string().optional().nullable(),
  paidAmountPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  date: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
})

// GET /api/exchanges - List old gold exchanges
export async function GET(request: NextRequest) {
  const timer = new RequestTimer()
  try {
    await requirePermission('exchanges:read')
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') as ExchangeType | null
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = searchParams.get('limit') ? Math.min(parseInt(searchParams.get('limit')!, 10), 100) : undefined
    const skip = limit ? (page - 1) * limit : undefined

    const where = {
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { voucherNo: { contains: search, mode: 'insensitive' as const } },
              { customerName: { contains: search, mode: 'insensitive' as const } },
              { customerPhone: { contains: search } },
            ],
          }
        : {}),
    }

    const [exchanges, totalCount] = await timer.track(() =>
      Promise.all([
        db.oldGoldExchange.findMany({
          where,
          orderBy: { date: 'desc' },
          ...(limit ? { take: limit, skip } : {}),
        }),
        db.oldGoldExchange.count({ where }),
      ])
    )

    timer.log('GET', '/api/exchanges', 200)
    return jsonResponse(
      {
        exchanges,
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
    timer.log('GET', '/api/exchanges', 500)
    return errorResponse((err as Error).message || 'Failed to fetch exchanges', 500, undefined, timer)
  }
}

// POST /api/exchanges - Create old gold exchange voucher
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('exchanges:create')
    const body = await request.json()
    const parsed = createExchangeSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid exchange data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const exchange = await ExchangeService.createExchange({
      ...parsed.data,
      performedById: user.id,
      performedByName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, exchange }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create exchange voucher', 400)
  }
}
