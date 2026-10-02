import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/notifications - List notifications for current user or broadcast
export async function GET() {
  try {
    const user = await requireAuth()

    const notifications = await db.appNotification.findMany({
      where: {
        OR: [{ forUserId: user.id }, { forUserId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return jsonResponse({ notifications })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch notifications', 500)
  }
}

// POST /api/notifications - Create notification
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    if (!body.title || !body.message) {
      return errorResponse('Title and message are required', 400)
    }

    const notification = await db.appNotification.create({
      data: {
        title: body.title,
        message: body.message,
        type: body.type || 'INFO',
        forUserId: body.forUserId || null,
        read: false,
      },
    })

    return jsonResponse({ success: true, notification }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create notification', 400)
  }
}
