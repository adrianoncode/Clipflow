import 'server-only'

import type { ValidateResult } from '@/lib/ai/providers/types'

/**
 * Validates an OpenAI API key by calling GET /v1/models.
 *
 * Consumes zero tokens. Uses an 8-second abort timeout to bound the action
 * runtime. Never logs the key — only the result code.
 */
export async function validateOpenAiKey(key: string): Promise<ValidateResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
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
        message: 'OpenAI rejected this key. Please double-check and try again.',
      }
    }

    if (response.status === 429) {
      return {
        ok: false,
        code: 'rate_limited',
        message: 'OpenAI is rate-limiting your requests right now. Try again in a moment.',
      }
    }

    return {
      ok: false,
      code: 'unknown',
      message: `OpenAI returned an unexpected response (${response.status}).`,
    }
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'AbortError' || name === 'TimeoutError') {
      return {
        ok: false,
        code: 'network',
        message: 'Timed out contacting OpenAI. Please try again.',
      }
    }
    return {
      ok: false,
      code: 'network',
      message: 'Could not reach OpenAI. Check your connection and try again.',
    }
  }
}
