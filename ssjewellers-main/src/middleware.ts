import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/health',
  '/_next',
  '/favicon.ico',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'ss-jewellery-erp-production-secret-key-min32chars'
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public assets and login endpoint
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Only enforce strict token gate on protected API routes
  if (pathname.startsWith('/api/')) {
    const token =
      request.cookies.get('ssj_session')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. No session token provided.', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    try {
      const secret = getJwtSecret()
      const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })

      if (!payload.sub) {
        return NextResponse.json(
          { error: 'Invalid token payload', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
      }

      // Attach verified user claims to request headers for downstream server components / handlers
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', payload.sub as string)
      requestHeaders.set('x-user-role', (payload.role as string) || 'STAFF')
      requestHeaders.set('x-user-name', (payload.name as string) || '')
      requestHeaders.set('x-user-username', (payload.username as string) || '')

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired session token. Please log in again.', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
