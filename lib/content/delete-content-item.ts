import 'server-only'

import { createClient } from '@/lib/supabase/server'

export async function deleteContentItem(
  contentId: string,
  workspaceId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', contentId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
