import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { hashPassword } from '@/lib/auth/password'

const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').toLowerCase().trim(),
  name: z.string().min(1, 'Name is required').trim(),
  phone: z.string().min(10, 'Valid phone number is required').trim(),
  email: z.string().email('Invalid email address').optional().nullable(),
  role: z.nativeEnum(UserRole),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  specialty: z.string().optional().nullable(),
})

// GET /api/users - List users
export async function GET() {
  try {
    await requirePermission('users:read')

    const users = await db.user.findMany({
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (err: unknown) {
    const status = (err as any)?.statusCode || 500
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to list users' },
      { status }
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePermission('users:create')
    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { username, name, phone, email, role, password, specialty } = parsed.data
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Check if username already exists
    const existing = await db.user.findUnique({
      where: { username },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Username '${username}' is already taken` },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    const newUser = await db.user.create({
      data: {
        username,
        name,
        phone,
        email: email || null,
        role,
        passwordHash,
        specialty: specialty || null,
        active: true,
        mustChangePassword: true, // Force user to set their own password on first login
      },
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
        createdAt: true,
      },
    })

    // Log creation in audit log
    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        userName: adminUser.name,
        action: 'CREATE_USER',
        entity: 'User',
        entityId: newUser.id,
        details: `Created new user '${newUser.username}' with role ${newUser.role}`,
        ipAddress,
      },
    })

    return NextResponse.json({ success: true, user: newUser }, { status: 201 })
  } catch (err: unknown) {
    console.error('Create user error:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
