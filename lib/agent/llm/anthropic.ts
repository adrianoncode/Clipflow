import 'server-only'

import { log } from '@/lib/log'
import {
  fromAnthropicResponseContent,
  toAnthropicMessages,
} from '@/lib/agent/llm/message-format'
import { toAnthropicTools, type AnthropicTool } from '@/lib/agent/llm/tool-format'
import type {
  AgentLlmRequest,
  AgentLlmResult,
  NormalizedStopReason,
} from '@/lib/agent/llm/types'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const ANTHROPIC_BETA = 'prompt-caching-2024-07-31'
const REQUEST_TIMEOUT_MS = 60_000

/**
 * Anthropic Messages API adapter for the agent LLM layer.
 *
 * Wraps the existing prompt-caching pattern (system + tools as
 * cacheable prefix blocks) but takes/returns the normalized shapes
 * defined in `lib/agent/llm/types.ts` so the agent loop stays
 * provider-agnostic.
 *
 * Differences from `lib/ai/generate/anthropic.ts`:
 *   - That one forces a single tool_use call (structured output mode)
 *     for Step 4 draft generation.
 *   - This one is open-ended: model picks any tools, can chain.
 */
export async function callAnthropic(
  req: AgentLlmRequest,
): Promise<AgentLlmResult> {
  const tools = attachCacheControlToTools(toAnthropicTools(req.tools))

  const body = {
    model: req.model,
    max_tokens: req.maxTokens,
    temperature: req.temperature ?? 0.7,
    // System prompt as a content-block array so we can attach
    // cache_control. Anthropic requires the cache marker on the
    // last cacheable block in the prefix to seal it.
    system: [
      {
        type: 'text' as const,
        text: req.system,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages: toAnthropicMessages(req.messages),
    tools,
  }

  let response: Response
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': req.apiKey,
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
    log.error('agent.llm.anthropic unexpected status', new Error(errBody), {
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

  if (!parsed || typeof parsed !== 'object') {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Anthropic response was not an object.',
    }
  }

  const r = parsed as {
    stop_reason?: string
    content?: unknown
    usage?: {
      input_tokens?: number
      output_tokens?: number
      cache_creation_input_tokens?: number
      cache_read_input_tokens?: number
    }
  }

  const stopReason = mapStopReason(r.stop_reason)
  if (!stopReason) {
    return {
      ok: false,
      code: 'parse_error',
      message: `Unknown stop_reason: ${String(r.stop_reason)}`,
    }
  }

  const blocks = fromAnthropicResponseContent(r.content)

  return {
    ok: true,
    stopReason,
    blocks,
    usage: {
      inputTokens: r.usage?.input_tokens ?? 0,
      outputTokens: r.usage?.output_tokens ?? 0,
      cacheCreationTokens: r.usage?.cache_creation_input_tokens,
      cacheReadTokens: r.usage?.cache_read_input_tokens,
    },
    model: req.model,
  }
}

// ─── helpers ─────────────────────────────────────────────────────────

/** Mark the LAST tool with cache_control so Anthropic caches the
 *  entire tool list as one prefix block. */
function attachCacheControlToTools(tools: AnthropicTool[]): AnthropicTool[] {
  if (tools.length === 0) return []
  const result = tools.map((t) => ({ ...t }))
  result[result.length - 1]!.cache_control = { type: 'ephemeral' }
  return result
}

function mapStopReason(raw: string | undefined): NormalizedStopReason | null {
  switch (raw) {
    case 'end_turn':
    case 'tool_use':
    case 'max_tokens':
    case 'stop_sequence':
    case 'refusal':
      return raw
    case 'pause_turn':
      // Anthropic uses pause_turn for server-side tool pauses (not us
      // — that's their hosted tools). Treat as end_turn so the loop
      // exits cleanly rather than treating it as malformed.
      return 'end_turn'
    default:
      return null
  }
}
