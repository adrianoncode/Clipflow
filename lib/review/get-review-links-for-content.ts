import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface ReviewLinkRow {
  id: string
  token: string
  label: string | null
  is_active: boolean
  expires_at: string | null
  created_at: string
}

/**
 * Returns all review links for a given content item.
 * Requires the caller to be an authenticated workspace member.
 */
export async function getReviewLinksForContent(
  contentId: string,
  workspaceId: string,
): Promise<ReviewLinkRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('review_links')
    .select('id, token, label, is_active, expires_at, created_at')
    .eq('content_id', contentId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getReviewLinksForContent]', error.message)
    return []
  }
  return data ?? []
}
