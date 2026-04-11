import 'server-only'

import type { ValidateResult } from '@/lib/ai/providers/types'

/**
 * Validates a Google Gemini API key by calling GET /v1beta/models.
 *
 * Google uses a ?key= query-string auth, which is safe here because this
 * runs server-to-server (no browser history / referrer leakage).
 */
export async function validateGoogleKey(key: string): Promise<ValidateResult> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
    })

    if (response.ok) {
      return { ok: true }
    }

    // Google surfaces invalid keys as either 400 INVALID_ARGUMENT or
    // 403 PERMISSION_DENIED, depending on the exact failure mode. Map both
    // to invalid_key.
    if (response.status === 400 || response.status === 403) {
      return {
        ok: false,
        code: 'invalid_key',
        message: 'Google rejected this key. Please double-check and try again.',
      }
    }

    if (response.status === 429) {
      return {
        ok: false,
        code: 'rate_limited',
        message: 'Google is rate-limiting your requests right now. Try again in a moment.',
      }
    }

    return {
      ok: false,
      code: 'unknown',
      message: `Google returned an unexpected response (${response.status}).`,
    }
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'AbortError' || name === 'TimeoutError') {
      return {
        ok: false,
        code: 'network',
        message: 'Timed out contacting Google. Please try again.',
      }
    }
    return {
      ok: false,
      code: 'network',
      message: 'Could not reach Google. Check your connection and try again.',
    }
  }
}
