import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { ok, fail, type ActionResult } from '@/lib/actions/result'

/**
 * Deletes a single output row by id, scoped to the workspace.
 * CASCADE ON DELETE takes out the associated output_states rows automatically.
 * Used by per-platform regenerate (M5) — not the "regenerate all" flow,
 * which uses deleteOutputsForContent.
 */
export async function deleteSingleOutput(
  outputId: string,
  workspaceId: string,
): Promise<ActionResult> {
  const supabase = createClient()

  const { error } = await supabase
    .from('outputs')
    .delete()
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[deleteSingleOutput]', error.message)
    return fail('Could not delete output.', 'db_error')
  }

  return ok()
}
