import 'server-only'

import { log } from '@/lib/log'
import {
  fromOpenAiAssistantMessage,
  toOpenAiMessages,
} from '@/lib/agent/llm/message-format'
import { toOpenAiTools } from '@/lib/agent/llm/tool-format'
import type {
  AgentLlmRequest,
  AgentLlmResult,
  NormalizedStopReason,
} from '@/lib/agent/llm/types'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const REQUEST_TIMEOUT_MS = 60_000

/**
 * OpenAI Chat Completions API adapter.
 *
 * Notes on OpenAI tool use vs Anthropic:
 *   - Tool calls live as `tool_calls` on assistant messages, not
 *     inline content blocks.
 *   - Each tool result is its OWN message with role='tool' and a
 *     `tool_call_id` reference (Anthropic packs all results into
 *     one user turn).
 *   - Arguments come back as JSON-encoded strings, not objects.
 *   - Caching is fully automatic at the API layer for prefixes
 *     ≥1024 tokens; no markers needed (and none accepted).
 *   - Strict mode (`strict: true` on the function) guarantees the
 *     model emits arguments matching the JSON Schema exactly.
 */
export async function callOpenAi(
  req: AgentLlmRequest,
): Promise<AgentLlmResult> {
  // Build the messages array. System goes as the first message.
  const messages = [
    { role: 'system' as const, content: req.system },
    ...toOpenAiMessages(req.messages),
  ]

  const body: Record<string, unknown> = {
    model: req.model,
    messages,
    max_completion_tokens: req.maxTokens,
    temperature: req.temperature ?? 0.7,
  }
  if (req.tools.length > 0) {
    body.tools = toOpenAiTools(req.tools)
    // 'auto' = model decides whether to call a tool. We never force
    // a specific tool — agent chooses freely (or the loop exits
    // when it stops calling).
    body.tool_choice = 'auto'
    // Allow multiple tool calls per turn (default true on newer
    // models, but explicit for safety).
    body.parallel_tool_calls = true
  }

  let response: Response
  try {
    response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${req.apiKey}`,
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
        message: 'OpenAI request timed out after 60s.',
      }
    }
    return {
      ok: false,
      code: 'network',
      message: 'Could not reach OpenAI.',
    }
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    if (response.status === 401) {
      return {
        ok: false,
        code: 'invalid_key',
        status: 401,
        message: 'OpenAI rejected the API key.',
      }
    }
    if (response.status === 429) {
      return {
        ok: false,
        code: 'rate_limited',
        status: 429,
        message: 'OpenAI rate-limited this request.',
      }
    }
    if (response.status === 503 || response.status === 502) {
      return {
        ok: false,
        code: 'overloaded',
        status: response.status,
        message: 'OpenAI is overloaded.',
      }
    }
    log.error('agent.llm.openai unexpected status', new Error(errBody), {
      status: response.status,
      bodyPreview: errBody.slice(0, 300),
    })
    return {
      ok: false,
      code: 'provider_error',
      status: response.status,
      message: `OpenAI returned ${response.status}.`,
    }
  }

  let parsed: unknown
  try {
    parsed = await response.json()
  } catch {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Could not parse OpenAI response JSON.',
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      ok: false,
      code: 'parse_error',
      message: 'OpenAI response was not an object.',
    }
  }

  const r = parsed as {
    choices?: Array<{
      message?: unknown
      finish_reason?: string
    }>
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      prompt_tokens_details?: { cached_tokens?: number }
    }
  }

  const choice = r.choices?.[0]
  if (!choice) {
    return {
      ok: false,
      code: 'parse_error',
      message: 'OpenAI response had no choices.',
    }
  }

  const stopReason = mapStopReason(choice.finish_reason)
  if (!stopReason) {
    return {
      ok: false,
      code: 'parse_error',
      message: `Unknown finish_reason: ${String(choice.finish_reason)}`,
    }
  }

  const blocks = fromOpenAiAssistantMessage(choice.message)

  // OpenAI reports cached_tokens (the count of input tokens that hit
  // the cache). The non-cached input is `prompt_tokens - cached`.
  const cached = r.usage?.prompt_tokens_details?.cached_tokens ?? 0
  const promptTokens = r.usage?.prompt_tokens ?? 0
  const uncachedInput = Math.max(0, promptTokens - cached)

  return {
    ok: true,
    stopReason,
    blocks,
    usage: {
      inputTokens: uncachedInput,
      outputTokens: r.usage?.completion_tokens ?? 0,
      cacheReadTokens: cached > 0 ? cached : undefined,
      // OpenAI doesn't separate cache writes from regular input —
      // first hit just gets billed at normal input rate. Leave
      // cacheCreationTokens unset.
    },
    model: req.model,
  }
}

function mapStopReason(raw: string | undefined): NormalizedStopReason | null {
  switch (raw) {
    case 'stop':
      return 'end_turn'
    case 'tool_calls':
    case 'function_call':
      return 'tool_use'
    case 'length':
      return 'max_tokens'
    case 'content_filter':
      return 'refusal'
    default:
      return null
  }
}
