import 'server-only'

import {
  GENERATION_MAX_TOKENS,
  GENERATION_TEMPERATURE,
  GENERATION_TIMEOUT_MS,
} from '@/lib/ai/generate/models'
import { promptOutputSchema } from '@/lib/ai/generate/schemas'
import type { GenerateInput, GenerateResult } from '@/lib/ai/generate/types'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * OpenAI Chat Completions with JSON mode.
 *
 * Notes:
 * - `response_format: { type: 'json_object' }` requires the literal word
 *   "json" to appear somewhere in the prompt. The caller's system prompt
 *   says "Respond with a JSON object …" so this is satisfied upstream.
 * - Timeout via AbortSignal. Do NOT wrap the body in a `Request` — undici
 *   has had boundary bugs on that path; pass the body directly.
 * - Never logs the API key. Only the HTTP status code on non-2xx.
 */
export async function generateWithOpenAi(
  input: Omit<GenerateInput, 'provider'>,
): Promise<GenerateResult> {
  const { apiKey, model, system, user } = input

  let response: Response
  try {
    response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
        temperature: GENERATION_TEMPERATURE,
        max_tokens: GENERATION_MAX_TOKENS,
      }),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    })
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
      message: 'Could not reach OpenAI. Check your connection and retry.',
    }
  }

  if (!response.ok) {
    switch (response.status) {
      case 401:
      case 402:
        return {
          ok: false,
          code: 'invalid_key',
          message:
            response.status === 402
              ? 'OpenAI reports insufficient quota for this key. Check billing or use a different key.'
              : 'OpenAI rejected this key. Update it in Settings → AI Keys.',
        }
      case 429:
        return {
          ok: false,
          code: 'rate_limited',
          message: 'OpenAI rate-limited this request. Try again in a moment.',
        }
      default:
        // eslint-disable-next-line no-console
        console.error('[openai.generate] unexpected status', response.status)
        return {
          ok: false,
          code: 'provider_error',
          message: `OpenAI returned an unexpected error (${response.status}).`,
        }
    }
  }

  let rawContent: unknown
  try {
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>
    }
    rawContent = body.choices?.[0]?.message?.content
  } catch {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Could not parse the OpenAI response envelope.',
    }
  }

  if (typeof rawContent !== 'string') {
    return {
      ok: false,
      code: 'parse_error',
      message: 'OpenAI returned no text content.',
    }
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(rawContent)
  } catch {
    return {
      ok: false,
      code: 'parse_error',
      message: 'OpenAI returned a non-JSON body inside the JSON-mode response.',
    }
  }

  const schema = promptOutputSchema.safeParse(parsedJson)
  if (!schema.success) {
    return {
      ok: false,
      code: 'schema_error',
      message: 'OpenAI returned JSON that did not match the expected shape.',
    }
  }

  return { ok: true, json: schema.data, model }
}
