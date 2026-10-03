import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().min(10, 'Valid phone number is required').optional(),
  email: z.string().email('Invalid email address').optional().nullable(),
  role: z.nativeEnum(UserRole).optional(),
  active: z.boolean().optional(),
  specialty: z.string().optional().nullable(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/users/[id] - Get user detail
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('users:read')
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        active: true,
        specialty: true,
        mustChangePassword: true,
        lastLogin: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requirePermission('users:update')
    const { id } = await params
    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Prevent deactivating own account
    if (parsed.data.active === false && id === adminUser.id) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own administrative account' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        active: true,
        specialty: true,
        mustChangePassword: true,
        updatedAt: true,
      },
    })

    // If an Admin user's name was updated, synchronize it to ShopSetting.ownerName
    if (parsed.data.name && (existingUser.role === 'ADMIN' || existingUser.id === 'usr-admin' || existingUser.username === 'admin')) {
      await db.shopSetting.upsert({
        where: { id: 'default' },
        update: { ownerName: parsed.data.name.trim() },
        create: { id: 'default', ownerName: parsed.data.name.trim() },
      })
    }

    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        userName: adminUser.name,
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: id,
        details: `Updated user '${existingUser.username}' attributes`,
        oldValue: { role: existingUser.role, active: existingUser.active },
        newValue: { role: updatedUser.role, active: updatedUser.active },
        ipAddress,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Soft-deactivate user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requirePermission('users:delete')
    const { id } = await params
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (id === adminUser.id) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own administrative account' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Soft delete / deactivate
    const deactivatedUser = await db.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, username: true, active: true },
    })

    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        userName: adminUser.name,
        action: 'DEACTIVATE_USER',
        entity: 'User',
        entityId: id,
        details: `Deactivated user account '${existingUser.username}'`,
        ipAddress,
      },
    })

    return NextResponse.json({
      success: true,
      message: `User '${existingUser.username}' deactivated successfully`,
      user: deactivatedUser,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to deactivate user' },
      { status: 500 }
    )
  }
}
