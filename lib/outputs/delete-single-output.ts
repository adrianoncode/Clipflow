import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type DeleteSingleOutputResult = { ok: true } | { ok: false; error: string }

/**
 * Deletes a single output row by id, scoped to the workspace.
 * CASCADE ON DELETE takes out the associated output_states rows automatically.
 * Used by per-platform regenerate (M5) — not the "regenerate all" flow,
 * which uses deleteOutputsForContent.
 */
export async function deleteSingleOutput(
  outputId: string,
  workspaceId: string,
): Promise<DeleteSingleOutputResult> {
  const supabase = createClient()

  const { error } = await supabase
    .from('outputs')
    .delete()
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[deleteSingleOutput]', error.message)
    return { ok: false, error: 'Could not delete output.' }
  }

  return { ok: true }
}
