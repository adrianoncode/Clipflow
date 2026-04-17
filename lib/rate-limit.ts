import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

/**
 * Upstash Redis-backed rate limiter.
 * Works across multiple Vercel serverless instances.
 *
 * Falls back to a permissive no-op if UPSTASH_REDIS_REST_URL is not set
 * (local dev without Redis), so the app never breaks.
 */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

function createLimiter(limit: number, windowSec: number) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    analytics: true,
    prefix: 'clipflow:rl',
  })
}

/**
 * Check if a key has exceeded the rate limit.
 * @param key - Unique identifier (e.g. userId, userId:action)
 * @param limit - Max requests per window
 * @param windowMs - Time window in milliseconds (default: 60s)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000,
): Promise<RateLimitResult> {
  const windowSec = Math.max(1, Math.round(windowMs / 1000))
  const limiter = createLimiter(limit, windowSec)

  // No Redis configured → allow all (local dev)
  if (!limiter) {
    return { ok: true, remaining: limit, resetAt: Date.now() + windowMs }
  }

  const result = await limiter.limit(key)
  return {
    ok: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  }
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
