import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/workshop/wastage - List wastage records
export async function GET() {
  try {
    await requirePermission('workshop:read')

    const wastages = await db.wastageRecord.findMany({
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    })

    return jsonResponse({ wastages })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch wastage records', 500)
  }
}

// POST /api/workshop/wastage - Record wastage
export async function POST(request: Request) {
  try {
    const user = await requirePermission('workshop:wastage_entry')
    const body = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const inputWeightMg = BigInt(body.inputWeightMg || Math.round((Number(body.inputWeight) || 0) * 1000))
    const outputWeightMg = BigInt(body.outputWeightMg || Math.round((Number(body.outputWeight) || 0) * 1000))
    const wastageWeightMg = inputWeightMg > outputWeightMg ? inputWeightMg - outputWeightMg : BigInt(0)
    const wastageBps = inputWeightMg > BigInt(0) ? Math.round(Number((wastageWeightMg * BigInt(10000)) / inputWeightMg)) : 0

    const wastage = await db.wastageRecord.create({
      data: {
        workOrderId: body.workOrderId,
        workId: body.workId || 'WF-MANUAL',
        stepName: body.stepName || body.stage || 'Production',
        inputWeightMg,
        outputWeightMg,
        wastageWeightMg,
        wastageBps,
        userId: user.id,
        userName: user.name,
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'RECORD_WASTAGE',
        entity: 'WastageRecord',
        entityId: wastage.id,
        details: `Recorded wastage in ${wastage.stepName} for ${wastage.workId}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, wastageRecord: wastage }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to record wastage', 400)
  }
}
