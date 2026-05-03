import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'

/**
 * Append one row to `agent_tool_calls` per tool invocation. Called by
 * the loop after every tool handler returns (or throws).
 *
 * Service-role write because the loop runs server-side and must record
 * even when the user's session has expired mid-conversation. Reads
 * from the UI go through RLS via the user-scoped client.
 *
 * Errors here are LOGGED but NOT propagated — telemetry should never
 * take down the agent loop. If the row write fails we lose one
 * observability data point; if we threw, we'd lose the whole run.
 */
function db() {
  // Same pattern as lib/agent/state.ts — agent_* tables aren't yet in
  // the generated Database type. Strip this cast after running
  // `supabase gen types typescript --linked` post-migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminClient() as any
}

export interface RecordToolCallInput {
  runId: string
  workspaceId: string
  toolName: string
  input: unknown
  output: unknown
  latencyMs: number
  /** Estimated cost attributable to this tool call (usually 0 — most
   *  cost lives in the surrounding LLM round-trip, not the tool itself). */
  costMicroUsd?: bigint
  success: boolean
  error?: string | null
}

export async function recordToolCall(input: RecordToolCallInput): Promise<void> {
  try {
    const { error } = await db()
      .from('agent_tool_calls')
      .insert({
        run_id: input.runId,
        workspace_id: input.workspaceId,
        tool_name: input.toolName,
        input: input.input ?? {},
        output: input.output ?? null,
        latency_ms: input.latencyMs,
        cost_micro_usd: (input.costMicroUsd ?? 0n).toString(),
        success: input.success,
        error: input.error ?? null,
      })
    if (error) {
      log.error('agent.telemetry: recordToolCall db error', error, {
        runId: input.runId,
        toolName: input.toolName,
      })
    }
  } catch (err) {
    log.error(
      'agent.telemetry: recordToolCall threw',
      err instanceof Error ? err : new Error(String(err)),
      { runId: input.runId, toolName: input.toolName },
    )
  }
}
