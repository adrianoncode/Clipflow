import 'server-only'
import * as Sentry from '@sentry/nextjs'

/**
 * Structured logger for Clipflow server code.
 *
 * Replaces scattered `console.error('[context]', ...)` calls with a
 * typed API that:
 *   - Emits JSON in production (parseable by Vercel log drains)
 *   - Pretty-prints in development (readable in the terminal)
 *   - Auto-forwards `error()` and `fatal()` to Sentry
 *   - Accepts a structured `context` object — never string-concat
 *     `workspace_id=${id}`; pass `{ workspaceId: id }` instead.
 *
 * Usage:
 *
 *   import { log } from '@/lib/log'
 *
 *   log.info('user signed up', { userId: u.id })
 *   log.warn('rate limit hit', { workspaceId, limit: 100 })
 *   log.error('could not fetch outputs', err, { workspaceId, contentId })
 *
 * Migrate gradually — existing `console.error` lines keep working.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

type LogContext = Record<string, unknown>

const IS_PROD = process.env.NODE_ENV === 'production'

function emit(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
  const timestamp = new Date().toISOString()

  const payload: Record<string, unknown> = {
    level,
    message,
    timestamp,
    ...(context ?? {}),
  }

  if (error) {
    if (error instanceof Error) {
      payload.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } else {
      payload.error = error
    }
  }

  if (IS_PROD) {
    // JSON for log drains / Vercel → Datadog etc.
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level === 'fatal' ? 'error' : level](
      JSON.stringify(payload),
    )
  } else {
    // Pretty for dev — human-readable
    const prefix = `${timestamp} [${level.toUpperCase()}]`
    const ctx = context && Object.keys(context).length > 0 ? ' ' + JSON.stringify(context) : ''
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level === 'fatal' ? 'error' : level](
      `${prefix} ${message}${ctx}`,
      error ?? '',
    )
  }

  // Forward errors to Sentry. No-ops when DSN isn't configured.
  if (level === 'error' || level === 'fatal') {
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: context as Record<string, unknown> | undefined })
    } else {
      Sentry.captureMessage(message, {
        level: level === 'fatal' ? 'fatal' : 'error',
        extra: context as Record<string, unknown> | undefined,
      })
    }
  }
}

export const log = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  /**
   * Record an error. Second argument can be an Error/unknown, or a
   * context object when there's no underlying exception.
   */
  error: (message: string, errorOrContext?: unknown, context?: LogContext) => {
    // Disambiguate: if second arg is Error-like, treat it as the error.
    if (
      errorOrContext instanceof Error ||
      (typeof errorOrContext === 'object' && errorOrContext !== null && 'stack' in errorOrContext)
    ) {
      emit('error', message, context, errorOrContext)
    } else {
      emit('error', message, errorOrContext as LogContext | undefined)
    }
  },
  fatal: (message: string, errorOrContext?: unknown, context?: LogContext) => {
    if (
      errorOrContext instanceof Error ||
      (typeof errorOrContext === 'object' && errorOrContext !== null && 'stack' in errorOrContext)
    ) {
      emit('fatal', message, context, errorOrContext)
    } else {
      emit('fatal', message, errorOrContext as LogContext | undefined)
    }
  },
}
