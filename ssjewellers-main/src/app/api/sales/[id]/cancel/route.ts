import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth/guards'
import { SalesService } from '@/lib/services/sales.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const cancelSchema = z.object({
  cancelReason: z.string().min(3, 'Cancellation reason is required (min 3 characters)'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/sales/[id]/cancel - Cancel sale invoice
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('sales:cancel')
    const { id } = await params
    const body = await request.json()
    const parsed = cancelSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid cancellation data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const cancelledSale = await SalesService.cancelSale({
      saleId: id,
      cancelledById: user.id,
      cancelledByName: user.name,
      cancelReason: parsed.data.cancelReason,
      ipAddress,
    })

    return jsonResponse({
      success: true,
      message: `Invoice ${cancelledSale.invoiceNo} cancelled successfully`,
      sale: cancelledSale,
    })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to cancel sale', 400)
  }
}
