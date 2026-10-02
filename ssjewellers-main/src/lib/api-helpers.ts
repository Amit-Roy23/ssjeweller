import { NextResponse } from 'next/server'

/**
 * Recursively converts BigInt values to standard Numbers or Strings so they can be serialized to JSON safely.
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj

  if (typeof obj === 'bigint') {
    // If within safe JavaScript integer range, convert to Number, else string
    return Number(obj) as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item)) as unknown as T
  }

  if (typeof obj === 'object') {
    if (obj instanceof Date) return obj

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value)
    }
    return result as T
  }

  return obj
}

/**
 * Standardized API Response Helper with automatic BigInt serialization.
 */
export function jsonResponse<T>(data: T, init?: ResponseInit): NextResponse {
  const sanitized = serializeBigInt(data)
  return NextResponse.json(sanitized, init)
}

/**
 * Standardized API Error Response Helper.
 */
export function errorResponse(
  message: string,
  statusCode = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status: statusCode }
  )
}

/**
 * Universal API Error Handler that preserves AuthError/ApiError status codes.
 */
export function handleApiError(err: unknown, defaultStatus = 500): NextResponse {
  const status = (err as any)?.statusCode || (err as any)?.status || defaultStatus
  const message = (err as Error)?.message || 'Internal Server Error'
  return NextResponse.json(
    {
      error: message,
      code: status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'ERROR',
    },
    { status }
  )
}
