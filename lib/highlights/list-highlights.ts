import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import { log } from '@/lib/log'

export interface HighlightRow {
  id: string
  content_id: string
  workspace_id: string
  start_seconds: number
  end_seconds: number
  hook_text: string | null
  reason: string | null
  virality_score: number | null
  status: 'draft' | 'rendering' | 'ready' | 'failed'
  render_id: string | null
  video_url: string | null
  render_error: string | null
  caption_style: string
  aspect_ratio: string
  crop_x: number | null
  thumbnail_url: string | null
  /** jsonb bag for user edits + future knobs. See Phase A1 in the
   *  clip-preview-editor — stores customCaptionText, audioGainDb,
   *  thumbnailSeconds under metadata.edits. */
  metadata: Json
  created_at: string
}

/**
 * Lists highlights for a content item, sorted by virality score
 * descending (with created_at as a stable tiebreaker). RLS enforces
 * workspace membership on top of the explicit workspace_id filter.
 */
export async function listHighlights(
  contentId: string,
  workspaceId: string,
): Promise<HighlightRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_highlights')
    .select(
      'id, content_id, workspace_id, start_seconds, end_seconds, hook_text, reason, virality_score, status, render_id, video_url, render_error, caption_style, aspect_ratio, crop_x, thumbnail_url, metadata, created_at',
    )
    .eq('content_id', contentId)
    .eq('workspace_id', workspaceId)
    .order('virality_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    log.error('listHighlights failed', error, { contentId, workspaceId })
    return []
  }

  // Cast through unknown because numeric columns come back as string
  // from PostgREST when Postgres numeric(10,2) would otherwise lose
  // precision. Coerce explicitly so consumers see numbers.
  return (data ?? []).map((r) => {
    const row = r as {
      start_seconds: unknown
      end_seconds: unknown
      virality_score: unknown
      crop_x: unknown
    }
    return {
      ...(r as unknown as HighlightRow),
      start_seconds: Number(row.start_seconds),
      end_seconds: Number(row.end_seconds),
      virality_score: row.virality_score == null ? null : Number(row.virality_score),
      crop_x: row.crop_x == null ? null : Number(row.crop_x),
    }
  })
}
