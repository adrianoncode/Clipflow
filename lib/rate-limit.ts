/**
 * Simple in-memory rate limiter.
 * For production, replace with Redis (Upstash) for multi-instance support.
 */

const store = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a key has exceeded the rate limit.
 * @param key - Unique identifier (e.g. userId, userId:action)
 * @param limit - Max requests per window
 * @param windowMs - Time window in milliseconds (default: 60s)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000,
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  // Clean up expired entries periodically
  if (store.size > 10000) {
    for (const [k, v] of store) {
      if (v.resetAt < now) store.delete(k)
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Preset rate limits for different actions.
 */
export const RATE_LIMITS = {
  /** AI generation: 20 requests per minute per user */
  generation: { limit: 20, windowMs: 60_000 },
  /** Script coach: 10 requests per minute per user */
  scriptCoach: { limit: 10, windowMs: 60_000 },
  /** Content creation: 10 per minute per user */
  contentCreate: { limit: 10, windowMs: 60_000 },
  /** API routes: 30 per minute per user */
  api: { limit: 30, windowMs: 60_000 },
} as const
