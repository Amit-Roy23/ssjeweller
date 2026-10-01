import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/guards'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'

const resetPasswordSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireRole([UserRole.ADMIN])
    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { targetUserId, newPassword } = parsed.data
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Validate strength
    const strengthCheck = validatePasswordStrength(newPassword)
    if (!strengthCheck.valid) {
      return NextResponse.json(
        { error: strengthCheck.errors.join(', ') },
        { status: 400 }
      )
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    const newPasswordHash = await hashPassword(newPassword)

    await db.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: true, // Force password change on next login
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })

    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        userName: adminUser.name,
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: targetUser.id,
        details: `Password reset performed by Admin for user '${targetUser.username}'`,
        ipAddress,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${targetUser.name}. They will be prompted to change it upon next login.`,
    })
  } catch (err: unknown) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
