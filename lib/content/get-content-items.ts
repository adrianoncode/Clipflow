import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { ContentKind, ContentStatus } from '@/lib/supabase/types'

export interface ContentItemListRow {
  id: string
  kind: ContentKind
  status: ContentStatus
  title: string | null
  source_url: string | null
  created_at: string
}

interface GetContentItemsOptions {
  limit?: number
}

/**
 * Lists content items in a workspace, most recent first. RLS restricts to
 * rows the caller can see (any member of the workspace).
 *
 * Wrapped in React cache so the list + the workspace header can share a
 * single query per request. Defaults to limit 50 — M6+ can add pagination.
 */
export const getContentItems = cache(
  async (
    workspaceId: string,
    options: GetContentItemsOptions = {},
  ): Promise<ContentItemListRow[]> => {
    const supabase = createClient()
    const limit = options.limit ?? 50
    const { data, error } = await supabase
      .from('content_items')
      .select('id, kind, status, title, source_url, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[getContentItems]', error.message)
      return []
    }

    return (data ?? []) as ContentItemListRow[]
  },
)
