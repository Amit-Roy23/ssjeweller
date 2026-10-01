import { NextRequest } from 'next/server'
import { z } from 'zod'
import { PaymentMode } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { SalesService } from '@/lib/services/sales.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const paymentSchema = z.object({
  amountPaise: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  paymentMode: z.nativeEnum(PaymentMode),
  transactionId: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/sales/[id]/payments - Record payment against sale
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('payments:create')
    const { id } = await params
    const body = await request.json()
    const parsed = paymentSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid payment data', 400, parsed.error.issues)
    }

    const sale = await db.sale.findUnique({ where: { id } })
    if (!sale) return errorResponse('Sale invoice not found', 404)

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const payment = await SalesService.recordPayment({
      saleId: sale.id,
      invoiceNo: sale.invoiceNo,
      customerId: sale.customerId,
      customerName: sale.customerName,
      amountPaise: parsed.data.amountPaise,
      paymentMode: parsed.data.paymentMode,
      transactionId: parsed.data.transactionId,
      remarks: parsed.data.remarks,
      receivedById: user.id,
      receivedByName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, payment }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to record payment', 400)
  }
}
