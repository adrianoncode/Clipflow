import 'server-only'

import type { AgentContext } from '@/lib/agent/context'
import type { WorkspaceRole } from '@/lib/auth/require-workspace-member'

/**
 * Tool registry contract.
 *
 * One tool = one file under `lib/agent/tools/<name>.ts`, default-exporting
 * a `ToolDef`. The registry in `index.ts` collects them, validates
 * names are unique, and exposes filter helpers (e.g. "give me only
 * read-only tools" for autopilot trigger scoping).
 *
 * Why we don't use Zod schemas directly in tool definitions: Anthropic's
 * tool API expects the canonical JSON Schema shape, and round-tripping
 * Zod → JSON Schema adds runtime cost + a dependency (zod-to-json-schema)
 * that bloats the bundle. We hand-write the schema (it's also the most
 * important contract — easier to keep precise without indirection) and
 * write a small `parseInput()` per tool for runtime validation.
 */

/** Minimal Anthropic tool-input JSON Schema. */
export interface ToolInputSchema {
  type: 'object'
  properties: Record<string, JsonSchemaProp>
  required?: string[]
  additionalProperties?: boolean
}

export type JsonSchemaProp =
  | { type: 'string'; description?: string; enum?: string[] }
  | { type: 'number'; description?: string; minimum?: number; maximum?: number }
  | { type: 'integer'; description?: string; minimum?: number; maximum?: number }
  | { type: 'boolean'; description?: string }
  | {
      type: 'array'
      description?: string
      items: JsonSchemaProp
      minItems?: number
      maxItems?: number
    }
  | {
      type: 'object'
      description?: string
      properties?: Record<string, JsonSchemaProp>
      required?: string[]
    }

/**
 * A tool handler returns one of three result shapes:
 *
 *   - `{ kind: 'ok', value }`       — happy path; `value` becomes the
 *                                     tool_result content (JSON-serialized
 *                                     and shown to the model).
 *
 *   - `{ kind: 'parked', waitingOn }` — the tool kicked off async work
 *                                       (transcription, render). The loop
 *                                       parks the run in waiting_external;
 *                                       webhook resumes it later.
 *
 *   - `{ kind: 'error', message, retryable? }` — refused / failed.
 *                                                The model sees an
 *                                                is_error tool_result
 *                                                and can adjust strategy.
 *
 * Throwing from a handler is also fine — the loop catches and converts
 * to `{ kind: 'error', message: err.message, retryable: false }`.
 * `ToolPermissionError` specifically is propagated as `retryable: false`
 * (the model shouldn't try the same denied operation again).
 */
export type ToolResult =
  | { kind: 'ok'; value: unknown }
  | { kind: 'parked'; waitingOn: WaitingOnPayload }
  | { kind: 'error'; message: string; retryable?: boolean }

export interface WaitingOnPayload {
  kind: 'content_item_status' | 'render_complete' | 'transcription_complete'
  id: string
  expected?: string
}

export type ToolHandler = (
  ctx: AgentContext,
  input: unknown,
) => Promise<ToolResult>

export interface ToolDef {
  /** Lowercase snake_case name. Stable identifier — DO NOT rename
   *  without a migration step (logged in `agent_tool_calls.tool_name`). */
  name: string
  /** Single-sentence description shown to the model in the tool list.
   *  Tighter wording = fewer wrong-tool selections; iterate based on
   *  Phase 2.5 telemetry. */
  description: string
  schema: ToolInputSchema
  handler: ToolHandler
  /** Lowest role permitted to invoke this tool. Defense in depth — the
   *  loop also re-checks ctx.role before dispatch. */
  requiredRole: WorkspaceRole
  /** Informational. Helps autopilot tool subset filtering and
   *  observability (mutating tools get extra audit attention). */
  mutates: boolean
  /**
   * If true, this tool may pause the run by returning `kind: 'parked'`.
   * The loop is built to handle parked results regardless, but the
   * flag lets the autopilot scheduler know which trigger types CAN
   * outlive the cron tick (transcription auto-pilot needs parked
   * tools; pure read tools never park).
   */
  canPark?: boolean
}
