import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { SalesService } from '@/lib/services/sales.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const returnSchema = z.object({
  saleId: z.string().min(1, 'Sale ID is required'),
  originalInvoiceNo: z.string().min(1, 'Original Invoice No is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  productName: z.string().min(1, 'Product name is required'),
  productId: z.string().optional().nullable(),
  returnQuantity: z.number().int().positive().default(1),
  returnWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  reason: z.string().min(3, 'Return reason is required'),
  refundAmountPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : 0n)),
  exchangeAmountPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : 0n)),
  restockProduct: z.boolean().default(true),
})

// GET /api/sales/returns - List sales returns
export async function GET() {
  try {
    await requirePermission('sales:read')

    const returns = await db.salesReturn.findMany({
      orderBy: { date: 'desc' },
      include: {
        sale: { select: { invoiceNo: true, customerName: true, customerPhone: true } },
      },
    })

    return jsonResponse({ returns })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch returns', 500)
  }
}

// POST /api/sales/returns - Process return
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('sales:create')
    const body = await request.json()
    const parsed = returnSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid return data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const salesReturn = await SalesService.processSalesReturn({
      ...parsed.data,
      performedById: user.id,
      performedByName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, return: salesReturn }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to process return', 400)
  }
}
