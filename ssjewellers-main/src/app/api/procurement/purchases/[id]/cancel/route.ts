import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth/guards'
import { ProcurementService } from '@/lib/services/procurement.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const cancelSchema = z.object({
  cancelReason: z.string().min(3, 'Cancel reason is required'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/procurement/purchases/[id]/cancel - Cancel purchase
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('purchases:cancel')
    const { id } = await params
    const body = await request.json()
    const parsed = cancelSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid cancellation data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const cancelledPurchase = await ProcurementService.cancelPurchase(
      id,
      parsed.data.cancelReason,
      user.id,
      user.name,
      ipAddress
    )

    return jsonResponse({
      success: true,
      message: `Purchase ${cancelledPurchase.purchaseId} cancelled`,
      purchase: cancelledPurchase,
    })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to cancel purchase', 400)
  }
}
