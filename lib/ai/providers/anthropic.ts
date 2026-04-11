import 'server-only'

import type { ValidateResult } from '@/lib/ai/providers/types'

/**
 * Validates an Anthropic API key by calling GET /v1/models.
 *
 * Uses x-api-key plus the required anthropic-version header. Consumes zero
 * tokens.
 */
export async function validateAnthropicKey(key: string): Promise<ValidateResult> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (response.ok) {
      return { ok: true }
    }

    if (response.status === 401) {
      return {
        ok: false,
        code: 'invalid_key',
        message: 'Anthropic rejected this key. Please double-check and try again.',
      }
    }

    if (response.status === 429) {
      return {
        ok: false,
        code: 'rate_limited',
        message: 'Anthropic is rate-limiting your requests right now. Try again in a moment.',
      }
    }

    return {
      ok: false,
      code: 'unknown',
      message: `Anthropic returned an unexpected response (${response.status}).`,
    }
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'AbortError' || name === 'TimeoutError') {
      return {
        ok: false,
        code: 'network',
        message: 'Timed out contacting Anthropic. Please try again.',
      }
    }
    return {
      ok: false,
      code: 'network',
      message: 'Could not reach Anthropic. Check your connection and try again.',
    }
  }
}
