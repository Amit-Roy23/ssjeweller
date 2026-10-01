import { NextRequest } from 'next/server'
import { z } from 'zod'
import { WorkStatusValue } from '@prisma/client'
import { requirePermission } from '@/lib/auth/guards'
import { WorkshopService } from '@/lib/services/workshop.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const updateStepSchema = z.object({
  stepIndex: z.number().int().nonnegative('Step index must be valid'),
  status: z.nativeEnum(WorkStatusValue),
  inputWeightMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : null)),
  outputWeightMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : null)),
  assignedToId: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/workshop/orders/[id]/steps - Update work order step
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('workshop:update_step')
    const { id } = await params
    const body = await request.json()
    const parsed = updateStepSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid step data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const result = await WorkshopService.updateWorkOrderStep({
      workOrderId: id,
      stepIndex: parsed.data.stepIndex,
      status: parsed.data.status,
      inputWeightMg: parsed.data.inputWeightMg,
      outputWeightMg: parsed.data.outputWeightMg,
      assignedToId: parsed.data.assignedToId,
      remarks: parsed.data.remarks,
      actorUserId: user.id,
      actorUserName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, ...result })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update step', 400)
  }
}
