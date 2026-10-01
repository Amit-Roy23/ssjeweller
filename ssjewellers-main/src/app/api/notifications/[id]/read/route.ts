import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/notifications/[id]/read - Mark notification as read
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params

    const notification = await db.appNotification.update({
      where: { id },
      data: { read: true },
    })

    return jsonResponse({ success: true, notification })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to mark notification read', 500)
  }
}
