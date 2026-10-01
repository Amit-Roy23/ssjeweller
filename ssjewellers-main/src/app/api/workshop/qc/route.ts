import { NextRequest } from 'next/server'
import { z } from 'zod'
import { QCResult } from '@prisma/client'
import { requirePermission } from '@/lib/auth/guards'
import { WorkshopService } from '@/lib/services/workshop.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const qcSchema = z.object({
  workOrderId: z.string().min(1, 'Work Order ID is required'),
  weightChecked: z.boolean().default(false),
  purityChecked: z.boolean().default(false),
  designChecked: z.boolean().default(false),
  stoneChecked: z.boolean().default(false),
  finishingChecked: z.boolean().default(false),
  result: z.nativeEnum(QCResult),
  remarks: z.string().optional().nullable(),
})

// POST /api/workshop/qc - Record quality inspection
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('workshop:qc')
    const body = await request.json()
    const parsed = qcSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid QC data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const qc = await WorkshopService.recordQualityCheck({
      ...parsed.data,
      checkedById: user.id,
      checkedByName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, qualityCheck: qc }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to record QC', 400)
  }
}
