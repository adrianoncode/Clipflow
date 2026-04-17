import 'server-only'

import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Thin wrapper around checkRateLimit for server actions — returns a
 * user-facing error message shaped like `{ ok: false, error }` when
 * the limit is hit, otherwise `{ ok: true }`.
 *
 * Usage:
 *   const rl = await checkWorkspaceRateLimit(workspaceId, 'videoRender')
 *   if (!rl.ok) return { ok: false, error: rl.error, code: 'rate_limited' }
 *
 * Minutes remaining is rounded up so the UI message feels honest
 * ("15 minutes" not "14.7").
 */
export async function checkWorkspaceRateLimit(
  workspaceId: string,
  preset: keyof typeof RATE_LIMITS,
): Promise<{ ok: true } | { ok: false; error: string; retryAfterMs: number }> {
  const cfg = RATE_LIMITS[preset]
  const key = `workspace:${workspaceId}:${preset}`
  const result = await checkRateLimit(key, cfg.limit, cfg.windowMs)
  if (result.ok) return { ok: true }

  const retryAfterMs = Math.max(0, result.resetAt - Date.now())
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000))
  return {
    ok: false,
    error: `Rate limit reached. Please wait ${minutes} minute${minutes === 1 ? '' : 's'} and try again.`,
    retryAfterMs,
  }
}
