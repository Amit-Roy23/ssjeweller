import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/session'
import { ROLE_PERMISSIONS } from '@/lib/auth/permissions'

export async function GET() {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Fetch fresh details from DB
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        specialty: true,
        mustChangePassword: true,
        lastLogin: true,
        createdAt: true,
      },
    })

    if (!user || !user.active) {
      return NextResponse.json(
        { error: 'User account inactive or not found', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const permissions = ROLE_PERMISSIONS[user.role] || []

    return NextResponse.json({
      user,
      permissions,
    })
  } catch (err: unknown) {
    console.error('Auth /me error:', err)
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 })
  }
}
