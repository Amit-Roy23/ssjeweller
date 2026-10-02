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

    // Automatically serialize Prisma Decimal (Decimal.js instance or Decimal-like object with {s, e, d})
    if (typeof (obj as any)?.toNumber === 'function') {
      return (obj as any).toNumber()
    }
    if (
      's' in (obj as any) &&
      'e' in (obj as any) &&
      'd' in (obj as any) &&
      Array.isArray((obj as any).d)
    ) {
      return (typeof (obj as any).toString === 'function'
        ? Number((obj as any).toString())
        : Number(obj)) as unknown as T
    }

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value)
    }
    return result as T
  }

  return obj
}

/**
 * High-precision server timing tracker for API profiling and telemetry.
 */
export class RequestTimer {
  private startTime = performance.now()
  private dbTime = 0
  private queries = 0

  recordDb(durationMs: number) {
    this.dbTime += durationMs
    this.queries++
  }

  async track<R>(fn: () => Promise<R>): Promise<R> {
    const start = performance.now()
    try {
      return await fn()
    } finally {
      this.recordDb(performance.now() - start)
    }
  }

  getHeaders(): HeadersInit {
    const total = Math.round(performance.now() - this.startTime)
    const db = Math.round(this.dbTime)
    return {
      'Server-Timing': `total;dur=${total}, db;dur=${db}`,
      'X-Response-Time': `${total}ms`,
      'X-Prisma-Queries': `${this.queries}`,
    }
  }

  log(method: string, path: string, status = 200) {
    const total = Math.round(performance.now() - this.startTime)
    const db = Math.round(this.dbTime)
    console.log(`[API_TIMING] ${method} ${path} ${status} - ${total}ms (db: ${db}ms, queries: ${this.queries})`)
  }
}

/**
 * Standardized API Response Helper with automatic BigInt serialization and server timing.
 */
export function jsonResponse<T>(data: T, init?: ResponseInit, timer?: RequestTimer): NextResponse {
  const sanitized = serializeBigInt(data)
  const timingHeaders = timer ? timer.getHeaders() : {}
  const headers = new Headers(init?.headers)

  if (timer) {
    const entries = timer.getHeaders() as Record<string, string>
    for (const [k, v] of Object.entries(entries)) {
      headers.set(k, v)
    }
  }

  return NextResponse.json(sanitized, {
    ...init,
    headers,
  })
}

/**
 * Standardized API Error Response Helper.
 */
export function errorResponse(
  message: string,
  statusCode = 400,
  details?: unknown,
  timer?: RequestTimer
): NextResponse {
  const headers = new Headers()
  if (timer) {
    const entries = timer.getHeaders() as Record<string, string>
    for (const [k, v] of Object.entries(entries)) {
      headers.set(k, v)
    }
  }

  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status: statusCode, headers }
  )
}

/**
 * Universal API Error Handler that preserves AuthError/ApiError status codes.
 */
export function handleApiError(err: unknown, defaultStatus = 500, timer?: RequestTimer): NextResponse {
  const status = (err as any)?.statusCode || (err as any)?.status || defaultStatus
  const message = (err as Error)?.message || 'Internal Server Error'
  const headers = new Headers()
  if (timer) {
    const entries = timer.getHeaders() as Record<string, string>
    for (const [k, v] of Object.entries(entries)) {
      headers.set(k, v)
    }
  }

  return NextResponse.json(
    {
      error: message,
      code: status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'ERROR',
    },
    { status, headers }
  )
}

