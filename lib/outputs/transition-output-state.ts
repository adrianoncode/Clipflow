import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { OutputState } from '@/lib/supabase/types'

export interface TransitionStateInput {
  outputId: string
  workspaceId: string
  newState: OutputState
  changedBy: string
  note?: string
}

export type TransitionStateResult = { ok: true } | { ok: false; error: string }

// Allowed forward and backward transitions.
const ALLOWED_TRANSITIONS: Record<OutputState, OutputState[]> = {
  draft: ['review'],
  review: ['draft', 'approved'],
  approved: ['review', 'exported'],
  exported: ['approved'],
}

/**
 * Inserts a new row into the append-only output_states table.
 *
 * Validates the transition is legal by reading the latest state from DB
 * (trusting the DB, not the client's stale prop). If the state has
 * already moved in another tab, the transition check reflects that.
 */
export async function transitionOutputState(
  input: TransitionStateInput,
): Promise<TransitionStateResult> {
  const supabase = createClient()

  // Read current state from DB — don't trust the client prop.
  const { data: states, error: readError } = await supabase
    .from('output_states')
    .select('state')
    .eq('output_id', input.outputId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (readError) {
    // eslint-disable-next-line no-console
    console.error('[transitionOutputState.read]', readError.message)
    return { ok: false, error: 'Could not read current state.' }
  }

  const currentState: OutputState = (states?.[0]?.state as OutputState) ?? 'draft'
  const allowed = ALLOWED_TRANSITIONS[currentState] ?? []

  if (!allowed.includes(input.newState)) {
    return {
      ok: false,
      error: `Cannot transition from "${currentState}" to "${input.newState}".`,
    }
  }

  const { error: insertError } = await supabase.from('output_states').insert({
    output_id: input.outputId,
    workspace_id: input.workspaceId,
    state: input.newState,
    changed_by: input.changedBy,
    note: input.note ?? null,
  })

  if (insertError) {
    // eslint-disable-next-line no-console
    console.error('[transitionOutputState.insert]', insertError.message)
    return { ok: false, error: 'Could not update state.' }
  }

  return { ok: true }
}
