import 'server-only'

import type { WaitingOn } from '@/lib/agent/state'

/**
 * Live events emitted by the agent loop, consumed by the SSE chat
 * endpoint to stream activity into the chat UI as it happens.
 *
 * Fired in this order for a typical turn:
 *
 *   run_start
 *   ├─ assistant_text                 (model is "talking")
 *   ├─ tool_use → tool_result         (model called a tool)
 *   ├─ ...repeated...
 *   ├─ cost_update                    (after each LLM round-trip)
 *   └─ done   |  parked  |  error
 *
 * Persistence is handled by the agent loop via existing state.ts +
 * recordToolCall — these events are purely for the wire. Reconstructing
 * a transcript from events alone is NOT supported; the canonical record
 * is `agent_messages` + `agent_tool_calls`.
 */
export type AgentEvent =
  | {
      type: 'run_start'
      runId: string
      conversationId: string | null
      provider: 'anthropic' | 'openai' | 'google'
      model: string
    }
  | { type: 'assistant_text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | {
      type: 'tool_result'
      toolUseId: string
      toolName: string
      output: unknown
      isError: boolean
      latencyMs: number
    }
  | {
      type: 'cost_update'
      costMicroUsd: string
      toolsThisRun: number
      inputTokens: number
      outputTokens: number
    }
  | {
      type: 'done'
      finalText: string
      parked?: { waitingOn: WaitingOn }
    }
  | {
      type: 'error'
      code:
        | 'no_key'
        | 'forbidden'
        | 'budget_exceeded'
        | 'anthropic_error'
        | 'tool_loop_runaway'
        | 'unexpected'
      message: string
    }

export type AgentEventListener = (event: AgentEvent) => void

/**
 * Encode an AgentEvent as a single SSE frame. Frame format:
 *
 *   event: <type>
 *   data: <json>
 *   <blank line>
 *
 * Why named events instead of always 'message': lets the client pick
 * handlers per event type without parsing JSON for every frame just to
 * route it. Trade-off is a few extra bytes per frame — worth it.
 */
export function formatSseFrame(event: AgentEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}
