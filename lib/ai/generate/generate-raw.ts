import 'server-only'

import type { AiProvider } from '@/lib/ai/providers/types'
import {
  GENERATION_MAX_TOKENS,
  GENERATION_TEMPERATURE,
  GENERATION_TIMEOUT_MS,
} from '@/lib/ai/generate/models'
import type { GenerationErrorCode } from '@/lib/ai/generate/types'

/**
 * Input shape for generateRaw — same as GenerateInput.
 */
export interface GenerateRawInput {
  provider: AiProvider
  apiKey: string
  model: string
  system: string
  user: string
}

/**
 * Result that returns raw parsed JSON (unknown) instead of
 * validating against promptOutputSchema. Every new feature that
 * returns custom JSON (calendars, predictions, chapters, etc.)
 * uses this instead of `generate()`.
 */
export type GenerateRawResult =
  | { ok: true; json: unknown; model: string }
  | { ok: false; code: GenerationErrorCode; message: string }

/**
 * Dispatches to the right provider and returns raw JSON without
 * any Zod schema validation. The caller is responsible for parsing
 * the returned `json` value into the correct shape.
 */
export async function generateRaw(input: GenerateRawInput): Promise<GenerateRawResult> {
  switch (input.provider) {
    case 'openai':
      return rawOpenAi(input)
    case 'anthropic':
      return rawAnthropic(input)
    case 'google':
      return rawGoogle(input)
  }
}

/* ─── OpenAI ──────────────────────────────────────────────────── */

async function rawOpenAi(input: Omit<GenerateRawInput, 'provider'>): Promise<GenerateRawResult> {
  const { apiKey, model, system, user } = input

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
    return networkError('OpenAI', err)
  }

  if (!response.ok) return httpError('OpenAI', response.status)

  try {
    const body = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> }
    const raw = body.choices?.[0]?.message?.content
    if (typeof raw !== 'string') return parseError('OpenAI', 'no text content')
    return { ok: true, json: JSON.parse(raw), model }
  } catch {
    return parseError('OpenAI', 'invalid JSON')
  }
}

/* ─── Anthropic ───────────────────────────────────────────────── */

async function rawAnthropic(input: Omit<GenerateRawInput, 'provider'>): Promise<GenerateRawResult> {
  const { apiKey, model, system, user } = input

  // Use a generic tool_use to get structured JSON
  const tool = {
    name: 'emit_result',
    description: 'Emit the structured result as a JSON object.',
    input_schema: {
      type: 'object' as const,
      additionalProperties: true,
    },
  }

  let response: Response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: GENERATION_MAX_TOKENS,
        system,
        messages: [{ role: 'user', content: user }],
        tools: [tool],
        tool_choice: { type: 'tool', name: 'emit_result' },
      }),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    })
  } catch (err) {
    return networkError('Anthropic', err)
  }

  if (!response.ok) return httpError('Anthropic', response.status)

  try {
    const body = (await response.json()) as {
      content?: Array<{ type: string; input?: unknown }>
    }
    const toolBlock = body.content?.find((b) => b.type === 'tool_use')
    if (!toolBlock?.input) return parseError('Anthropic', 'no tool_use block')
    return { ok: true, json: toolBlock.input, model }
  } catch {
    return parseError('Anthropic', 'invalid response')
  }
}

/* ─── Google ──────────────────────────────────────────────────── */

async function rawGoogle(input: Omit<GenerateRawInput, 'provider'>): Promise<GenerateRawResult> {
  const { apiKey, model, system, user } = input

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

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
        },
      }),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    })
  } catch (err) {
    return networkError('Google', err)
  }

  if (!response.ok) return httpError('Google', response.status)

  try {
    const body = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return parseError('Google', 'no text in response')
    return { ok: true, json: JSON.parse(text), model }
  } catch {
    return parseError('Google', 'invalid JSON')
  }
}

/* ─── Shared error helpers ────────────────────────────────────── */

function networkError(provider: string, err: unknown): GenerateRawResult {
  const name = (err as { name?: string })?.name
  if (name === 'AbortError' || name === 'TimeoutError') {
    return { ok: false, code: 'network', message: `Timed out contacting ${provider}.` }
  }
  return { ok: false, code: 'network', message: `Could not reach ${provider}. Check your connection.` }
}

function httpError(provider: string, status: number): GenerateRawResult {
  if (status === 401 || status === 402 || status === 403) {
    return { ok: false, code: 'invalid_key', message: `${provider} rejected this key (${status}).` }
  }
  if (status === 429 || status === 529) {
    return { ok: false, code: 'rate_limited', message: `${provider} rate-limited this request.` }
  }
  return { ok: false, code: 'provider_error', message: `${provider} returned error ${status}.` }
}

function parseError(provider: string, detail: string): GenerateRawResult {
  return { ok: false, code: 'parse_error', message: `${provider}: ${detail}.` }
}
