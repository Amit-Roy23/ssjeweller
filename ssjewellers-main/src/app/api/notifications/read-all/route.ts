import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// POST /api/notifications/read-all - Mark all notifications read for user
export async function POST() {
  try {
    const user = await requireAuth()

    await db.appNotification.updateMany({
      where: {
        OR: [{ forUserId: user.id }, { forUserId: null }],
        read: false,
      },
      data: { read: true },
    })

    return jsonResponse({ success: true, message: 'All notifications marked as read' })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to mark notifications as read', 500)
  }
}
