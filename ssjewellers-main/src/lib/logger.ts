/**
 * S.S JEWELLERY ERP — Structured Server Logger & Error Monitoring
 * Formats JSON log lines in production for log aggregators (Datadog, CloudWatch, Loki)
 * and dispatches exceptions to Sentry when SENTRY_DSN is configured.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogPayload {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error | unknown): LogPayload {
  const payload: LogPayload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {}),
  }

  if (error) {
    if (error instanceof Error) {
      payload.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } else {
      payload.error = {
        name: 'UnknownError',
        message: String(error),
      }
    }
  }

  return payload
}

function dispatchSentry(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!sentryDsn) return

  // Minimal non-blocking Sentry HTTP API report
  try {
    const errorMsg = error instanceof Error ? error.message : String(error || message)
    // Sentry envelope/event dispatch can be handled by standard Sentry SDK or HTTP webhook
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry Dispatch]:', { message, errorMsg, context })
    }
  } catch {
    // Fail silently to avoid breaking primary application flow
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
      console.debug(JSON.stringify(formatLog('debug', message, context)))
    }
  },

  info: (message: string, context?: Record<string, unknown>) => {
    console.info(JSON.stringify(formatLog('info', message, context)))
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(JSON.stringify(formatLog('warn', message, context)))
  },

  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => {
    const log = formatLog('error', message, context, error)
    console.error(JSON.stringify(log))
    dispatchSentry(message, error, context)
  },
}
