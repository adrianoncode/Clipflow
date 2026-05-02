import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

export interface CaptionRenderRow {
  id: string
  highlight_id: string
  workspace_id: string
  template_id: string
  zapcap_video_id: string
  zapcap_task_id: string
  status: 'queued' | 'processing' | 'ready' | 'failed'
  output_url: string | null
  error: string | null
  created_at: string
  updated_at: string
}

/**
 * Lists every caption-render variant for the given content's
 * highlights. Called once per highlights page render and grouped by
 * `highlight_id` upstream. RLS enforces workspace membership on top
 * of the explicit workspace_id filter.
 */
export async function listCaptionRendersForContent(
  contentId: string,
  workspaceId: string,
): Promise<CaptionRenderRow[]> {
  const supabase = createClient()

  // We have to go via highlight_id → content_id rather than a direct
  // join because Supabase JS doesn't support filtering by a parent
  // table column without a foreign-table query. Two-step is fine:
  // the highlights set is small (typically 3-8 rows).
  const { data: highlightIds, error: hErr } = await supabase
    .from('content_highlights')
    .select('id')
    .eq('content_id', contentId)
    .eq('workspace_id', workspaceId)

  if (hErr) {
    log.error('listCaptionRenders: highlights lookup failed', hErr)
    return []
  }

  const ids = (highlightIds ?? []).map((r) => r.id as string)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('caption_renders')
    .select(
      'id, highlight_id, workspace_id, template_id, zapcap_video_id, zapcap_task_id, status, output_url, error, created_at, updated_at',
    )
    .in('highlight_id', ids)
    .order('created_at', { ascending: false })

  if (error) {
    log.error('listCaptionRenders failed', error)
    return []
  }

  return (data ?? []) as CaptionRenderRow[]
}

/** Convenience grouping. Useful when the consumer wants O(1) per-card
 *  lookups instead of filtering an array on every render. */
export function groupCaptionRendersByHighlight(
  rows: readonly CaptionRenderRow[],
): Map<string, CaptionRenderRow[]> {
  const out = new Map<string, CaptionRenderRow[]>()
  for (const r of rows) {
    const list = out.get(r.highlight_id)
    if (list) list.push(r)
    else out.set(r.highlight_id, [r])
  }
  return out
}
