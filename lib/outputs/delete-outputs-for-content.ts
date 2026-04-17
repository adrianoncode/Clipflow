import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

export type DeleteOutputsResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Deletes every outputs row for `(content_id, workspace_id)`. The
 * `output_states.output_id FK` has `ON DELETE CASCADE` (M1 schema), so
 * Postgres removes the state rows automatically.
 *
 * Scoped on both columns even though RLS also enforces membership —
 * defence in depth against a URL tamper that somehow slips past RLS.
 *
 * Returns ok regardless of whether rows existed; the caller doesn't
 * care if 0 or N rows were deleted, only that no error happened.
 */
export async function deleteOutputsForContent(
  contentId: string,
  workspaceId: string,
): Promise<DeleteOutputsResult> {
  const supabase = createClient()
  const { error } = await supabase
    .from('outputs')
    .delete()
    .eq('content_id', contentId)
    .eq('workspace_id', workspaceId)

  if (error) {
    log.error('deleteOutputsForContent failed', error)
    return { ok: false, error: 'Could not clear previous outputs.' }
  }

  return { ok: true }
}
