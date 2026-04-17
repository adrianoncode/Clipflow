import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

export interface InternalReviewComment {
  id: string
  reviewer_name: string
  reviewer_email: string | null
  body: string
  created_at: string
  output_id: string | null
  output_platform: string | null
  link_label: string | null
}

/**
 * Returns all review comments for a content item, visible to authenticated
 * workspace members. Joins through review_links so we get the label, and
 * through outputs so we get the platform name.
 */
export async function getReviewCommentsForContent(
  contentId: string,
  workspaceId: string,
): Promise<InternalReviewComment[]> {
  const supabase = await createClient()

  // Fetch comments via review_links (scoped to workspace via content_id + workspace_id)
  const { data, error } = await supabase
    .from('review_comments')
    .select(`
      id,
      reviewer_name,
      reviewer_email,
      body,
      created_at,
      output_id,
      review_links!inner (
        label,
        workspace_id,
        content_id
      ),
      outputs (
        platform
      )
    `)
    .eq('review_links.content_id', contentId)
    .eq('review_links.workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    log.error('getReviewCommentsForContent failed', error)
    return []
  }

  return (data ?? []).map((row) => {
    const link = Array.isArray(row.review_links) ? row.review_links[0] : row.review_links
    const output = Array.isArray(row.outputs) ? row.outputs[0] : row.outputs
    return {
      id: row.id,
      reviewer_name: row.reviewer_name,
      reviewer_email: row.reviewer_email,
      body: row.body,
      created_at: row.created_at,
      output_id: row.output_id,
      output_platform: output?.platform ?? null,
      link_label: link?.label ?? null,
    }
  })
}
