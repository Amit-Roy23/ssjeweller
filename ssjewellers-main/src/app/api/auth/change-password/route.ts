import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/guards'
import { verifyPassword, hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth/session'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuth({ allowMustChangePassword: true })
    const body = await request.json()
    const parsed = changePasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = parsed.data
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Validate password policy
    const strengthCheck = validatePasswordStrength(newPassword)
    if (!strengthCheck.valid) {
      return NextResponse.json(
        { error: strengthCheck.errors.join(', ') },
        { status: 400 }
      )
    }

    // Fetch user with password hash
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Incorrect current password' },
        { status: 400 }
      )
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword)
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    })

    // Log audit event
    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'PASSWORD_CHANGED',
        entity: 'User',
        entityId: user.id,
        details: 'User changed password successfully',
        ipAddress,
      },
    })

    const safeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      specialty: updatedUser.specialty,
      mustChangePassword: false,
    }

    // Refresh session token
    const token = await createSessionToken(safeUser)
    const cookieOptions = getSessionCookieOptions()

    const response = NextResponse.json({
      success: true,
      message: 'Password changed successfully',
      user: safeUser,
    })

    response.cookies.set({
      ...cookieOptions,
      value: token,
    })

    return response
  } catch (err: unknown) {
    console.error('Change password error:', err)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
