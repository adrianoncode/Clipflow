import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { ok, fail, type ActionResult } from '@/lib/actions/result'
import { log } from '@/lib/log'

/**
 * Soft-delete a single output row. Sets `deleted_at` — the nightly
 * reaper cron hard-deletes rows older than 30 days.
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
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  if (error) {
    log.error('deleteSingleOutput failed', error, { workspaceId, outputId })
    return fail('Could not delete output.', 'db_error')
  }

  return ok()
}
