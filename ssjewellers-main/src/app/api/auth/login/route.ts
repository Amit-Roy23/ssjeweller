import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth/session'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { username, password } = parsed.data
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Find user by username
    const user = await db.user.findUnique({
      where: { username: username.toLowerCase() },
    })

    if (!user) {
      console.log(`[AUTH_LOGIN_DECISION] reason=user_not_found username=${username.toLowerCase()}`)
      // Record failed attempt audit
      await db.auditLog.create({
        data: {
          userName: username,
          action: 'LOGIN_FAILED',
          entity: 'User',
          details: `Failed login attempt: username '${username}' not found`,
          ipAddress,
        },
      })

      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Check if account is active
    if (!user.active) {
      console.log(`[AUTH_LOGIN_DECISION] reason=inactive username=${user.username}`)
      await db.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          details: 'Failed login attempt: account is disabled',
          ipAddress,
        },
      })

      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact an administrator.' },
        { status: 403 }
      )
    }

    // Check if account is temporarily locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      console.log(`[AUTH_LOGIN_DECISION] reason=locked username=${user.username}`)
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        {
          error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${waitMinutes} minutes.`,
        },
        { status: 429 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash)

    if (!isPasswordValid) {
      console.log(`[AUTH_LOGIN_DECISION] reason=wrong_password username=${user.username}`)
      const failedAttempts = user.failedLoginAttempts + 1
      const lockAccount = failedAttempts >= 5
      const lockedUntil = lockAccount ? new Date(Date.now() + 15 * 60 * 1000) : null // 15 min lockout

      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil,
        },
      })

      await db.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          details: lockAccount
            ? `Account locked: 5 consecutive failed login attempts`
            : `Failed login attempt (${failedAttempts}/5)`,
          ipAddress,
        },
      })

      return NextResponse.json(
        {
          error: lockAccount
            ? 'Account locked due to 5 failed attempts. Please try again after 15 minutes.'
            : 'Invalid username or password',
        },
        { status: 401 }
      )
    }

    // Password is valid - reset failed attempts and update last login
    console.log(`[AUTH_LOGIN_DECISION] reason=ok username=${user.username}`)
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    })

    // Record login audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
        details: `Successful login via role ${user.role}`,
        ipAddress,
      },
    })

    const safeUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      specialty: user.specialty,
      mustChangePassword: user.mustChangePassword,
    }

    // Generate JWT token
    const token = await createSessionToken(safeUser)

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token,
    })

    response.cookies.set('ssj_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (err: unknown) {
    console.error('Login error:', (err as Error)?.message || err, (err as Error)?.stack)
    return NextResponse.json(
      { error: (err as Error)?.message || 'An unexpected error occurred during login. Please try again.' },
      { status: 500 }
    )
  }
}
