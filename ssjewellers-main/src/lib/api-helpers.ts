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
