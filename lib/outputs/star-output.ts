import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { ok, fail, type ActionResult } from '@/lib/actions/result'

export async function toggleOutputStar(
  outputId: string,
  workspaceId: string,
  starred: boolean,
): Promise<ActionResult> {
  const supabase = createClient()
  const { error } = await supabase
    .from('outputs')
    .update({ is_starred: starred })
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)

  if (error) return fail('Could not update star.', 'db_error')
  return ok()
}
