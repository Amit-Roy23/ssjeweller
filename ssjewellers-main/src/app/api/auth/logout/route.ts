import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, SESSION_COOKIE_NAME } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (user) {
      await db.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'LOGOUT',
          entity: 'User',
          entityId: user.id,
          details: 'User logged out',
          ipAddress,
        },
      })
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })

    // Clear session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      path: '/',
      httpOnly: true,
      expires: new Date(0),
      maxAge: 0,
    })

    return response
  } catch (err: unknown) {
    console.error('Logout error:', err)
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 })
  }
}
