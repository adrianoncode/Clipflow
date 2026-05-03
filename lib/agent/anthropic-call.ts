import 'server-only'

import { log } from '@/lib/log'
import type {
  AnthropicToolFormat,
} from '@/lib/agent/tools'

/**
 * Single-turn Anthropic Messages API caller for the agent loop.
 *
 * Distinct from `lib/ai/generate/anthropic.ts` (which forces a single
 * structured-output tool_use). This one is open-ended: the model
 * picks any subset of registered tools, returns text + tool_use
 * blocks, and the loop iterates until `stop_reason='end_turn'`.
 *
 * v1 is non-streaming for simplicity. Streaming gets added in Phase 2
 * when the chat UI ships — the call signature is shaped now so adding
 * streaming later is a constructor flag rather than a parallel API.
 *
 * Prompt caching: the caller marks system + tools as cacheable (5-min
 * ephemeral). Anthropic's cache is per-API-key (per-org), so cross-
 * workspace sharing is zero — but within one workspace's
 * conversation, every turn after the first hits the cache for the
 * system prompt and tool schemas (the bulk of the input tokens).
 *
 * Returns the response body shape the loop needs, including raw
 * content blocks (so they can be appended to message history
 * verbatim — the next turn must include the assistant's prior
 * tool_use blocks paired with tool_result blocks).
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const ANTHROPIC_BETA = 'prompt-caching-2024-07-31'
const REQUEST_TIMEOUT_MS = 60_000

export type ContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'tool_use'
      id: string
      name: string
      input: unknown
    }
  | {
      type: 'tool_result'
      tool_use_id: string
      content: string | Array<{ type: 'text'; text: string }>
      is_error?: boolean
    }

export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: ContentBlock[] | string
}

export interface AnthropicUsage {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

export type AnthropicCallResult =
  | {
      ok: true
      stopReason:
        | 'end_turn'
        | 'tool_use'
        | 'max_tokens'
        | 'stop_sequence'
        | 'pause_turn'
        | 'refusal'
      content: ContentBlock[]
      usage: AnthropicUsage
      model: string
    }
  | {
      ok: false
      code:
        | 'network'
        | 'timeout'
        | 'invalid_key'
        | 'rate_limited'
        | 'overloaded'
        | 'provider_error'
        | 'parse_error'
      status?: number
      message: string
    }

export interface AnthropicCallParams {
  apiKey: string
  model: string
  /** System prompt — marked cacheable. */
  system: string
  /** Conversation so far. Already includes prior assistant turns +
   *  user tool_results from previous tool calls. */
  messages: AnthropicMessage[]
  tools: AnthropicToolFormat[]
  maxTokens: number
  /** Optional: lower temperature for autopilot (more deterministic). */
  temperature?: number
}

export async function callAnthropicAgent(
  params: AnthropicCallParams,
): Promise<AnthropicCallResult> {
  const body = {
    model: params.model,
    max_tokens: params.maxTokens,
    temperature: params.temperature ?? 0.7,
    // System message as a content-block array so we can attach
    // cache_control. The empty trailing block is what Anthropic
    // requires to mark the prefix cacheable.
    system: [
      {
        type: 'text' as const,
        text: params.system,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages: params.messages,
    tools: attachCacheControlToTools(params.tools),
  }

  let response: Response
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': params.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-beta': ANTHROPIC_BETA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'AbortError' || name === 'TimeoutError') {
      return {
        ok: false,
        code: 'timeout',
        message: 'Anthropic request timed out after 60s.',
      }
    }
    return {
      ok: false,
      code: 'network',
      message: 'Could not reach Anthropic.',
    }
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        code: 'invalid_key',
        status: response.status,
        message: 'Anthropic rejected the API key.',
      }
    }
    if (response.status === 429) {
      return {
        ok: false,
        code: 'rate_limited',
        status: 429,
        message: 'Anthropic rate-limited this request.',
      }
    }
    if (response.status === 529) {
      return {
        ok: false,
        code: 'overloaded',
        status: 529,
        message: 'Anthropic API is overloaded.',
      }
    }
    log.error('agent.anthropic-call unexpected status', new Error(errBody), {
      status: response.status,
      bodyPreview: errBody.slice(0, 300),
    })
    return {
      ok: false,
      code: 'provider_error',
      status: response.status,
      message: `Anthropic returned ${response.status}.`,
    }
  }

  let parsed: unknown
  try {
    parsed = await response.json()
  } catch {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Could not parse Anthropic response JSON.',
    }
  }

  const projected = projectResponse(parsed)
  if (!projected.ok) return projected

  return {
    ok: true,
    stopReason: projected.stopReason,
    content: projected.content,
    usage: projected.usage,
    model: params.model,
  }
}

// ─── helpers ─────────────────────────────────────────────────────────

/**
 * Mark the LAST tool with cache_control so Anthropic caches the
 * entire tool list as one prefix block. Putting cache_control on
 * EVERY tool is invalid; the marker must be on the final array entry
 * to capture the whole array as a cacheable chunk.
 */
function attachCacheControlToTools(
  tools: AnthropicToolFormat[],
): Array<AnthropicToolFormat & { cache_control?: { type: 'ephemeral' } }> {
  if (tools.length === 0) return []
  const result = tools.map((t) => ({ ...t }))
  ;(result[result.length - 1] as AnthropicToolFormat & {
    cache_control: { type: 'ephemeral' }
  }).cache_control = { type: 'ephemeral' }
  return result
}

interface ProjectedOk {
  ok: true
  stopReason: NonNullable<
    Extract<AnthropicCallResult, { ok: true }>['stopReason']
  >
  content: ContentBlock[]
  usage: AnthropicUsage
}

type ProjectedErr = Extract<AnthropicCallResult, { ok: false }>

function projectResponse(raw: unknown): ProjectedOk | ProjectedErr {
  if (!raw || typeof raw !== 'object') {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Anthropic response was not an object.',
    }
  }
  const r = raw as {
    stop_reason?: string
    content?: unknown
    usage?: { input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number }
  }

  if (!Array.isArray(r.content)) {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Anthropic response missing content array.',
    }
  }

  const stopReason = r.stop_reason
  if (
    stopReason !== 'end_turn' &&
    stopReason !== 'tool_use' &&
    stopReason !== 'max_tokens' &&
    stopReason !== 'stop_sequence' &&
    stopReason !== 'pause_turn' &&
    stopReason !== 'refusal'
  ) {
    return {
      ok: false,
      code: 'parse_error',
      message: `Unknown stop_reason: ${String(stopReason)}`,
    }
  }

  const content: ContentBlock[] = []
  for (const raw of r.content as unknown[]) {
    if (!raw || typeof raw !== 'object') continue
    const b = raw as Record<string, unknown>
    if (b.type === 'text' && typeof b.text === 'string') {
      content.push({ type: 'text', text: b.text })
    } else if (
      b.type === 'tool_use' &&
      typeof b.id === 'string' &&
      typeof b.name === 'string'
    ) {
      content.push({
        type: 'tool_use',
        id: b.id,
        name: b.name,
        input: b.input,
      })
    }
    // tool_result blocks only appear in user messages (request side),
    // never in responses — no need to project here.
  }

  const usage: AnthropicUsage = {
    input_tokens: r.usage?.input_tokens ?? 0,
    output_tokens: r.usage?.output_tokens ?? 0,
    cache_creation_input_tokens: r.usage?.cache_creation_input_tokens,
    cache_read_input_tokens: r.usage?.cache_read_input_tokens,
  }

  return { ok: true, stopReason, content, usage }
}
