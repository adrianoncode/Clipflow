import 'server-only'

import type { ToolDef } from '@/lib/agent/tools/types'

/**
 * Provider-agnostic types for the agent LLM layer.
 *
 * The agent loop maintains conversation history in `NormalizedMessage[]`
 * shape — a small superset of what every provider supports — and the
 * adapters (lib/agent/llm/{anthropic,openai,gemini}.ts) translate to/
 * from each provider's wire format at the API boundary.
 *
 * Why normalize: each provider's tool-use shape is structurally
 * different (Anthropic content blocks, OpenAI tool_calls/tool_call_id
 * pairing, Gemini functionCall parts). Doing the conversion once at
 * the edge keeps `run.ts` provider-agnostic.
 */

export type LlmProvider = 'anthropic' | 'openai' | 'google'

/**
 * One element of a turn. Three kinds:
 *   - text: the model's natural-language output, or the user's typed message
 *   - tool_use: the model invoking a registered tool (assistant turn only)
 *   - tool_result: the loop's reply with tool output (user turn only)
 *
 * Naming note: we use snake_case `tool_use` / `tool_result` (matching
 * Anthropic's wire format) so the loop and adapters share one term.
 * `toolUseId` is the camelCase property name on tool_result blocks
 * because we're in TS-land here, not on the wire.
 */
export type NormalizedBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | {
      type: 'tool_result'
      toolUseId: string
      /** Always a string — JSON-encoded if the underlying tool output
       *  was structured. Adapters re-wrap as needed for their wire
       *  format. */
      content: string
      isError?: boolean
    }

export interface NormalizedMessage {
  role: 'user' | 'assistant'
  blocks: NormalizedBlock[]
}

/**
 * Token counts as reported by the provider after a single round-trip.
 * Cache fields are optional because OpenAI doesn't expose cache
 * granularity (their cache is automatic and reported as a single
 * `prompt_tokens_details.cached_tokens` field) and Gemini's caching
 * we skip entirely in v1.
 */
export interface NormalizedUsage {
  inputTokens: number
  outputTokens: number
  cacheCreationTokens?: number
  cacheReadTokens?: number
}

/**
 * Why the model stopped. Normalized across providers:
 *   - 'end_turn': clean conversational stop (Anthropic 'end_turn',
 *                 OpenAI 'stop', Gemini 'STOP')
 *   - 'tool_use': model emitted tool_use block(s) and is waiting for
 *                 results before continuing
 *   - 'max_tokens': hit the per-call token cap (Anthropic 'max_tokens',
 *                   OpenAI 'length', Gemini 'MAX_TOKENS')
 *   - 'stop_sequence': model emitted a configured stop sequence (rare;
 *                      we don't configure any but adapters surface it
 *                      for safety)
 *   - 'refusal': model refused the request (OpenAI 4.5+, Anthropic
 *                'refusal'); the loop should stop and report
 */
export type NormalizedStopReason =
  | 'end_turn'
  | 'tool_use'
  | 'max_tokens'
  | 'stop_sequence'
  | 'refusal'

export interface AgentLlmRequest {
  provider: LlmProvider
  apiKey: string
  model: string
  /** System prompt — adapters attach provider-appropriate cache markers. */
  system: string
  /** Conversation history. Caller appends to this across turns. */
  messages: NormalizedMessage[]
  /** Registered tools available to the model. Adapters convert to
   *  provider-specific schema shape. */
  tools: ToolDef[]
  /** Per-call token cap. Distinct from the overall budget; this just
   *  bounds one round-trip. */
  maxTokens: number
  /** Optional. Defaults: 0.7 for chat, 0.3 for autopilot (caller decides). */
  temperature?: number
}

/**
 * Result of one round-trip. The loop appends `blocks` (filtered to
 * text + tool_use only — tool_result is user-side) onto messages as
 * an assistant turn before continuing.
 */
export type AgentLlmResult =
  | {
      ok: true
      stopReason: NormalizedStopReason
      blocks: Array<
        Extract<NormalizedBlock, { type: 'text' | 'tool_use' }>
      >
      usage: NormalizedUsage
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
