import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { ok, fail, type ActionResult } from '@/lib/actions/result'

/**
 * Soft-delete a content item. Sets `deleted_at` — the nightly reaper
 * cron hard-deletes rows older than 30 days. Restore within that
 * window via support.
 */
export async function deleteContentItem(
  contentId: string,
  workspaceId: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('content_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', contentId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  if (error) return fail('Could not delete content.', 'db_error')
  return ok()
}
