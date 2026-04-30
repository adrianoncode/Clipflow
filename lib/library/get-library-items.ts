import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface LibraryItem {
  id: string
  contentId: string
  title: string
  platform: 'tiktok' | 'instagram_reels' | 'youtube_shorts' | 'linkedin' | (string & {})
  state: string | null
  createdAt: string
}

export interface LibraryStats {
  total: number
  published: number
  inFlight: number
  drafts: number
}

/**
 * Fetches the workspace's full library — every output across every
 * source recording, joined with its content title and ordered by
 * recency.
 *
 * Capped at 500 rows; client filters/sorts in memory. The dashboard's
 * 5k cap is too generous for a list UI — pagination can come later if
 * users hit the wall.
 */
export async function getLibraryItems(
  workspaceId: string,
): Promise<{ items: LibraryItem[]; stats: LibraryStats }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('outputs')
    .select('id, content_id, platform, current_state, created_at, content_items!inner(title)')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error || !data) return { items: [], stats: zeroStats() }

  const items: LibraryItem[] = data.map((row) => {
    // Supabase-js types nested fk selects as either an object or an
    // array depending on inference — narrow once here so the rest of
    // the file only sees the object form.
    const ci = Array.isArray(row.content_items) ? row.content_items[0] : row.content_items
    return {
      id: row.id as string,
      contentId: row.content_id as string,
      title: (ci?.title as string | undefined) ?? 'Untitled',
      platform: row.platform as LibraryItem['platform'],
      state: (row.current_state as string | null) ?? null,
      createdAt: row.created_at as string,
    }
  })

  const stats: LibraryStats = {
    total: items.length,
    published: items.filter((i) => i.state === 'published' || i.state === 'live').length,
    inFlight: items.filter((i) =>
      ['scheduled', 'rendering', 'processing', 'transcribing'].includes(i.state ?? ''),
    ).length,
    drafts: items.filter((i) => i.state === 'draft' || i.state === 'review').length,
  }

  return { items, stats }
}

function zeroStats(): LibraryStats {
  return { total: 0, published: 0, inFlight: 0, drafts: 0 }
}
