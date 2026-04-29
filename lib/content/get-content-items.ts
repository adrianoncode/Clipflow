import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'
import type { ContentKind, ContentStatus } from '@/lib/supabase/types'

export interface ContentItemListRow {
  id: string
  kind: ContentKind
  status: ContentStatus
  title: string | null
  source_url: string | null
  created_at: string
  /** Sub-phase inside status=uploading|processing. Null when ready/failed
   *  or for legacy rows pre-Slice-8 migration. */
  processing_phase: string | null
  /** 0-100 hint for the current phase. Optional. */
  processing_progress: number | null
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
      .select('id, kind, status, title, source_url, created_at, processing_phase, processing_progress')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      log.error('getContentItems failed', error, { workspaceId })
      return []
    }

    return (data ?? []) as ContentItemListRow[]
  },
)

/**
 * ID of the most-recently-imported content item in a workspace, or
 * null if the workspace has none yet. Used by the workflow stepper to
 * make Steps 2-4 (per-video pages) deep-linkable from Library /
 * Pipeline / Schedule — clicking a step lands on the latest video so
 * the user can navigate the workflow without going through Step 1
 * again.
 */
export const getLatestContentId = cache(
  async (workspaceId: string): Promise<string | null> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('content_items')
      .select('id')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      log.error('getLatestContentId failed', error, { workspaceId })
      return null
    }

    return data?.id ?? null
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
      .select('id, kind, status, title, source_url, created_at, processing_phase, processing_progress', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      log.error('getContentItemsPaginated failed', error, { workspaceId, offset, limit })
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
