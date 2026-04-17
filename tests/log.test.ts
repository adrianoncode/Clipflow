import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Sentry so tests don't try to actually ship events.
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

import { log } from '@/lib/log'
import * as Sentry from '@sentry/nextjs'

describe('lib/log', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('info() does not forward to Sentry', () => {
    log.info('user signed up', { userId: 'abc' })
    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('warn() does not forward to Sentry', () => {
    log.warn('rate limit hit', { workspaceId: 'x' })
    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('error(msg, Error) forwards to Sentry with context', () => {
    const err = new Error('boom')
    log.error('could not fetch', err, { workspaceId: 'w1' })
    expect(Sentry.captureException).toHaveBeenCalledTimes(1)
    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      extra: { workspaceId: 'w1' },
    })
  })

  it('error(msg, contextObject) forwards captureMessage when no Error given', () => {
    log.error('validation failed', { field: 'email' })
    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(Sentry.captureMessage).toHaveBeenCalledWith('validation failed', {
      level: 'error',
      extra: { field: 'email' },
    })
  })

  it('fatal() forwards with fatal level', () => {
    log.fatal('db down')
    expect(Sentry.captureMessage).toHaveBeenCalledWith('db down', {
      level: 'fatal',
      extra: undefined,
    })
  })

  it('always writes to console.error for error level', () => {
    log.error('something broke')
    expect(consoleSpy).toHaveBeenCalled()
  })
})
