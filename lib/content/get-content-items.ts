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
  offset?: number
}

export interface ContentItemsResult {
  items: ContentItemListRow[]
  total: number
  hasMore: boolean
}

/**
 * Lists content items in a workspace, most recent first. RLS restricts to
 * rows the caller can see (any member of the workspace).
 *
 * Supports pagination via limit + offset. Returns total count for UI.
 */
export const getContentItems = cache(
  async (
    workspaceId: string,
    options: GetContentItemsOptions = {},
  ): Promise<ContentItemListRow[]> => {
    const supabase = createClient()
    const limit = options.limit ?? 50
    const offset = options.offset ?? 0
    const { data, error } = await supabase
      .from('content_items')
      .select('id, kind, status, title, source_url, created_at')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[getContentItems]', error.message)
      return []
    }

    return (data ?? []) as ContentItemListRow[]
  },
)

/**
 * Paginated version that also returns total count and hasMore flag.
 */
export const getContentItemsPaginated = cache(
  async (
    workspaceId: string,
    options: GetContentItemsOptions = {},
  ): Promise<ContentItemsResult> => {
    const supabase = createClient()
    const limit = options.limit ?? 50
    const offset = options.offset ?? 0

    const { data, error, count } = await supabase
      .from('content_items')
      .select('id, kind, status, title, source_url, created_at', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[getContentItemsPaginated]', error.message)
      return { items: [], total: 0, hasMore: false }
    }

    const items = (data ?? []) as ContentItemListRow[]
    const total = count ?? items.length

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    }
  },
)
