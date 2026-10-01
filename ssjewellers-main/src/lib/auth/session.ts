import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { AuthSessionUser, SessionPayload } from './types'

export const SESSION_COOKIE_NAME = 'ssj_session'
const DEFAULT_SESSION_DURATION = 7 * 24 * 60 * 60 // 7 days in seconds

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'ss-jewellery-erp-production-secret-key-min32chars'
  return new TextEncoder().encode(secret)
}

/**
 * Creates and signs a secure JWT token for a user session.
 */
export async function createSessionToken(
  user: AuthSessionUser,
  expiresInSeconds: number = DEFAULT_SESSION_DURATION
): Promise<string> {
  const secret = getJwtSecret()
  return new SignJWT({
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(secret)
}

/**
 * Verifies a JWT session token and returns the payload if valid.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })

    if (!payload.sub) return null

    return {
      sub: payload.sub as string,
      username: (payload.username as string) || '',
      name: (payload.name as string) || '',
      role: payload.role as SessionPayload['role'],
      email: (payload.email as string) || null,
      phone: (payload.phone as string) || '',
      mustChangePassword: Boolean(payload.mustChangePassword),
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

/**
 * Retrieves the current authenticated user session from HTTP cookies or Authorization header.
 */
export async function getSessionUser(): Promise<AuthSessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    const payload = await verifySessionToken(sessionCookie.value)
    if (!payload) return null

    return {
      id: payload.sub,
      username: payload.username,
      name: payload.name,
      role: payload.role,
      email: payload.email ?? null,
      phone: payload.phone,
      mustChangePassword: payload.mustChangePassword,
    }
  } catch {
    return null
  }
}

/**
 * Generates cookie serialization options for setting the session cookie.
 */
export function getSessionCookieOptions(expiresInSeconds: number = DEFAULT_SESSION_DURATION) {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: expiresInSeconds,
  }
}
