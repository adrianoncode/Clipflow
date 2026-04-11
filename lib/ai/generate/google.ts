import 'server-only'

import {
  GENERATION_MAX_TOKENS,
  GENERATION_TEMPERATURE,
  GENERATION_TIMEOUT_MS,
} from '@/lib/ai/generate/models'
import {
  PROMPT_OUTPUT_GEMINI_SCHEMA,
  promptOutputSchema,
} from '@/lib/ai/generate/schemas'
import type { GenerateInput, GenerateResult } from '@/lib/ai/generate/types'

/**
 * Gemini Generate Content with a structured responseSchema.
 *
 * Differences worth noting vs. OpenAI / Anthropic:
 * - Auth via ?key= query-string instead of a header (matches the M2
 *   validator for this provider; safe because it's server-to-server,
 *   not browser-visible).
 * - Schema uses UPPERCASE type names (`OBJECT`, `STRING`, `ARRAY`) —
 *   see PROMPT_OUTPUT_GEMINI_SCHEMA.
 * - System prompt goes in `systemInstruction.parts[]`, not in the
 *   contents array.
 * - Invalid keys surface as 400 INVALID_ARGUMENT OR 403 PERMISSION_DENIED
 *   depending on the failure mode; both map to `invalid_key`.
 */
export async function generateWithGoogle(
  input: Omit<GenerateInput, 'provider'>,
): Promise<GenerateResult> {
  const { apiKey, model, system, user } = input

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: user }] }],
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: {
          temperature: GENERATION_TEMPERATURE,
          maxOutputTokens: GENERATION_MAX_TOKENS,
          responseMimeType: 'application/json',
          responseSchema: PROMPT_OUTPUT_GEMINI_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    })
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
      message: 'Could not reach Google. Check your connection and retry.',
    }
  }

  if (!response.ok) {
    switch (response.status) {
      case 400:
      case 403:
        return {
          ok: false,
          code: 'invalid_key',
          message:
            'Google rejected this key. Update it in Settings → AI Keys.',
        }
      case 429:
        return {
          ok: false,
          code: 'rate_limited',
          message: 'Google rate-limited this request. Try again in a moment.',
        }
      default:
        // eslint-disable-next-line no-console
        console.error('[google.generate] unexpected status', response.status)
        return {
          ok: false,
          code: 'provider_error',
          message: `Google returned an unexpected error (${response.status}).`,
        }
    }
  }

  let rawText: unknown
  try {
    const body = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: unknown }> }
      }>
    }
    rawText = body.candidates?.[0]?.content?.parts?.[0]?.text
  } catch {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Could not parse the Google response envelope.',
    }
  }

  if (typeof rawText !== 'string') {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Google returned no text content.',
    }
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(rawText)
  } catch {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Google returned a non-JSON body under the json mime type.',
    }
  }

  const schema = promptOutputSchema.safeParse(parsedJson)
  if (!schema.success) {
    return {
      ok: false,
      code: 'schema_error',
      message: 'Google returned JSON that did not match the expected shape.',
    }
  }

  return { ok: true, json: schema.data, model }
}
