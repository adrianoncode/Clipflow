import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { OutputState } from '@/lib/supabase/types'
import { log } from '@/lib/log'

export interface ScheduleOutputInput {
  workspaceId: string
  outputId: string
  /** ISO 8601 timestamp. Pass null to UNSCHEDULE an output. */
  scheduledFor: string | null
}

export type ScheduleOutputResult =
  | { ok: true; scheduledFor: string | null }
  | {
      ok: false
      error: string
      code:
        | 'not_found'
        | 'not_approved'
        | 'invalid_time'
        | 'past_time'
        | 'db_error'
    }

/**
 * Lib version of `scheduleOutputAction` — applies the `outputs.scheduled_for`
 * write WITH a defense-in-depth check that the latest `output_states` row
 * is `approved`. The agent NEVER trusts the model to respect the approve
 * gate — this re-query at the lib boundary is the real enforcement.
 *
 * Skips:
 *   - Plan-tier check (caller's responsibility — UI surface enforces it)
 *   - revalidatePath (agent runs aren't tied to a particular page route;
 *     SSE stream + chat refetch carry the new state to the client)
 *
 * Pass `scheduledFor=null` to clear an existing schedule.
 */
export async function scheduleOutput(
  input: ScheduleOutputInput,
): Promise<ScheduleOutputResult> {
  const { workspaceId, outputId, scheduledFor } = input

  // 1. Validate the timestamp shape + reject past times for forward
  //    schedules (clearing with null is always allowed).
  if (scheduledFor !== null) {
    const ts = new Date(scheduledFor)
    if (Number.isNaN(ts.getTime())) {
      return {
        ok: false,
        code: 'invalid_time',
        error: 'scheduled_for must be an ISO 8601 timestamp.',
      }
    }
    if (ts.getTime() < Date.now() - 60_000) {
      // Allow ~1 minute slop for clock drift.
      return {
        ok: false,
        code: 'past_time',
        error: 'scheduled_for is in the past.',
      }
    }
  }

  const supabase = createClient()

  // 2. Confirm the output exists in this workspace + read its current
  //    state. RLS would already gate cross-workspace, but we want a
  //    crisp "not_found" instead of a silent no-op update.
  const { data: row, error: readError } = await supabase
    .from('outputs')
    .select('id')
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (readError) {
    log.error('scheduleOutput read failed', readError, { outputId, workspaceId })
    return { ok: false, code: 'db_error', error: 'Could not read output row.' }
  }
  if (!row) {
    return { ok: false, code: 'not_found', error: 'Output not found.' }
  }

  // 3. Defense-in-depth: re-check latest state from output_states.
  //    The agent system prompt says scheduling requires approve, but
  //    the prompt is advisory; this gate is binding.
  const { data: stateRows } = await supabase
    .from('output_states')
    .select('state')
    .eq('output_id', outputId)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentState = (stateRows?.[0]?.state ?? 'draft') as OutputState
  if (scheduledFor !== null && currentState !== 'approved') {
    return {
      ok: false,
      code: 'not_approved',
      error: `Cannot schedule — output is in "${currentState}" state. Only approved outputs can be scheduled.`,
    }
  }

  // 4. Apply the update.
  const { error: updateError } = await supabase
    .from('outputs')
    .update({ scheduled_for: scheduledFor })
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)

  if (updateError) {
    log.error('scheduleOutput update failed', updateError, {
      outputId,
      workspaceId,
    })
    return { ok: false, code: 'db_error', error: updateError.message }
  }

  return { ok: true, scheduledFor }
}
