import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { ContentKind, ContentStatus, Json } from '@/lib/supabase/types'

export interface ContentItemRow {
  id: string
  workspace_id: string
  project_id: string | null
  kind: ContentKind
  status: ContentStatus
  title: string | null
  source_url: string | null
  transcript: string | null
  metadata: Json
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Loads a single content item by id, scoped to the owning workspace so an
 * RLS bypass or a URL tamper can't leak data from another workspace. RLS
 * also enforces membership on top.
 */
export const getContentItem = cache(
  async (id: string, workspaceId: string): Promise<ContentItemRow | null> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('content_items')
      .select(
        'id, workspace_id, project_id, kind, status, title, source_url, transcript, metadata, created_by, created_at, updated_at',
      )
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[getContentItem]', error.message)
      return null
    }

    return (data as ContentItemRow | null) ?? null
  },
)
