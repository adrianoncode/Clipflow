import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { RenderKind, RenderProvider, RenderStatus } from '@/lib/supabase/types'

export interface RenderRow {
  id: string
  workspace_id: string
  content_id: string | null
  kind: RenderKind
  provider: RenderProvider
  provider_render_id: string | null
  status: RenderStatus
  url: string | null
  error: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

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
    .select('*')
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

const KIND_LABELS: Record<RenderKind, string> = {
  burn_captions: 'Burn captions',
  assemble_broll: 'Assemble B-Roll',
  branded_video: 'Branded video',
  clip: 'Clip',
  batch_clip: 'Batch clip',
  reframe: 'Reframe',
  subtitles: 'Subtitles',
  avatar: 'Avatar',
  dub: 'Auto-dub',
  faceless: 'Faceless',
}

export function formatRenderKind(kind: RenderKind): string {
  return KIND_LABELS[kind]
}
