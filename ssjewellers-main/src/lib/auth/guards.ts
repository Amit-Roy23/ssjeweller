import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { getSessionUser } from './session'
import { hasPermission } from './permissions'
import { AuthSessionUser, Permission } from './types'

export class AuthError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 401) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AuthError'
  }
}

/**
 * Ensures a request is authenticated. Returns the authenticated user or throws AuthError(401).
 */
export async function requireAuth(): Promise<AuthSessionUser> {
  const user = await getSessionUser()
  if (!user) {
    throw new AuthError('Authentication required. Please log in.', 401)
  }
  return user
}

/**
 * Ensures the authenticated user has one of the allowed roles.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSessionUser> {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(
      `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${user.role}`,
      403
    )
  }
  return user
}

/**
 * Ensures the authenticated user has a specific permission.
 */
export async function requirePermission(permission: Permission): Promise<AuthSessionUser> {
  const user = await requireAuth()
  if (!hasPermission(user.role, permission)) {
    throw new AuthError(
      `Access denied. You do not have permission to perform '${permission}'.`,
      403
    )
  }
  return user
}

/**
 * Standardized API Route guard helper.
 * Returns either `{ user: AuthSessionUser }` or `{ response: NextResponse }`.
 */
export async function apiGuard(options?: {
  roles?: UserRole[]
  permission?: Permission
}): Promise<{ user: AuthSessionUser } | { response: NextResponse }> {
  try {
    let user: AuthSessionUser
    if (options?.permission) {
      user = await requirePermission(options.permission)
    } else if (options?.roles && options.roles.length > 0) {
      user = await requireRole(options.roles)
    } else {
      user = await requireAuth()
    }
    return { user }
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return {
        response: NextResponse.json(
          { error: err.message, code: err.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN' },
          { status: err.statusCode }
        ),
      }
    }
    return {
      response: NextResponse.json(
        { error: 'Authentication failed', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    }
  }
}
