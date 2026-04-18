import 'server-only'

import {
  GENERATION_MAX_TOKENS,
  GENERATION_TEMPERATURE,
  GENERATION_TIMEOUT_MS,
} from '@/lib/ai/generate/models'
import {
  PROMPT_OUTPUT_JSON_SCHEMA,
  promptOutputSchema,
} from '@/lib/ai/generate/schemas'
import type { GenerateInput, GenerateResult } from '@/lib/ai/generate/types'
import { log } from '@/lib/log'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const TOOL_NAME = 'emit_output'

/**
 * Anthropic Messages with a forced tool_use call.
 *
 * We don't ask Claude for "JSON in prose" — we define a tool called
 * `emit_output`, declare its input_schema, and set `tool_choice` to force
 * Claude to call it. The response lives in `content[*]` as a `tool_use`
 * entry whose `input` field is the already-parsed JSON object. This
 * eliminates the class of errors where Claude wraps JSON in ```json
 * fences or adds commentary before/after the object.
 *
 * `max_tokens` is REQUIRED by the Messages API — do not omit it.
 */
export async function generateWithAnthropic(
  input: Omit<GenerateInput, 'provider'>,
): Promise<GenerateResult> {
  const { apiKey, model, system, user } = input

  let response: Response
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: GENERATION_MAX_TOKENS,
        temperature: GENERATION_TEMPERATURE,
        system,
        messages: [{ role: 'user', content: user }],
        tools: [
          {
            name: TOOL_NAME,
            description: 'Emit the generated platform post as structured fields.',
            input_schema: PROMPT_OUTPUT_JSON_SCHEMA,
          },
        ],
        tool_choice: { type: 'tool', name: TOOL_NAME },
      }),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    })
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
      message: 'Could not reach Anthropic. Check your connection and retry.',
    }
  }

  if (!response.ok) {
    switch (response.status) {
      case 401:
      case 403:
        return {
          ok: false,
          code: 'invalid_key',
          message:
            'Anthropic rejected this key. Update it in Settings → AI Keys.',
        }
      case 429:
      case 529:
        return {
          ok: false,
          code: 'rate_limited',
          message:
            response.status === 529
              ? 'Anthropic is overloaded. Try again in a moment.'
              : 'Anthropic rate-limited this request. Try again in a moment.',
        }
      default:
        log.error('anthropic.generate unexpected status', { status: response.status })
        return {
          ok: false,
          code: 'provider_error',
          message: `Anthropic returned an unexpected error (${response.status}).`,
        }
    }
  }

  let body: { content?: Array<{ type?: string; name?: string; input?: unknown }> }
  try {
    body = (await response.json()) as typeof body
  } catch {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Could not parse the Anthropic response envelope.',
    }
  }

  const toolUse = body.content?.find(
    (entry) => entry.type === 'tool_use' && entry.name === TOOL_NAME,
  )
  if (!toolUse || toolUse.input === undefined) {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Anthropic did not emit the expected tool_use block.',
    }
  }

  const schema = promptOutputSchema.safeParse(toolUse.input)
  if (!schema.success) {
    return {
      ok: false,
      code: 'schema_error',
      message: 'Anthropic returned JSON that did not match the expected shape.',
    }
  }

  return { ok: true, json: schema.data, model }
}
