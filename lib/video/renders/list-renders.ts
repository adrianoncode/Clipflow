import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { RenderRow } from '@/lib/video/renders/types'

export type { RenderRow } from '@/lib/video/renders/types'
export { formatRenderKind } from '@/lib/video/renders/types'

/**
 * Lists renders for a workspace, newest first. Optionally scoped to a
 * single content item. RLS restricts to workspace members.
 */
export async function listRenders(params: {
  workspaceId: string
  contentId?: string
  limit?: number
}): Promise<RenderRow[]> {
  const supabase = createClient()
  const query = supabase
    .from('renders')
    .select('id, workspace_id, content_id, kind, provider, provider_render_id, status, url, error, metadata, created_at, updated_at')
    .eq('workspace_id', params.workspaceId)
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 25)

  const { data, error } = params.contentId
    ? await query.eq('content_id', params.contentId)
    : await query

  if (error) {
    console.error('[listRenders]', error.message)
    return []
  }
  return (data ?? []) as RenderRow[]
}
