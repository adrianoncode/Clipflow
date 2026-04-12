import 'server-only'

import { createClient } from '@/lib/supabase/server'

export async function toggleOutputStar(
  outputId: string,
  workspaceId: string,
  starred: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('outputs')
    .update({ is_starred: starred })
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
