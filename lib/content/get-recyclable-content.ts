import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface RecyclableItem {
  id: string
  title: string | null
  kind: string
  created_at: string
  starred_outputs: number
  days_old: number
  reason: string
}

export async function getRecyclableContent(workspaceId: string): Promise<RecyclableItem[]> {
  const supabase = createClient()

  // Content older than 60 days
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

  const { data: items } = await supabase
    .from('content_items')
    .select('id, title, kind, created_at')
    .eq('workspace_id', workspaceId)
    .eq('status', 'ready')
    .lt('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!items?.length) return []

  // Get starred output counts per content item
  const { data: starred } = await supabase
    .from('outputs')
    .select('content_id')
    .eq('workspace_id', workspaceId)
    .eq('is_starred', true)
    .in('content_id', items.map(i => i.id))

  const starCountByContent: Record<string, number> = {}
  for (const s of starred ?? []) {
    starCountByContent[s.content_id] = (starCountByContent[s.content_id] ?? 0) + 1
  }

  return items.map(item => {
    const daysOld = Math.round((Date.now() - new Date(item.created_at).getTime()) / (24 * 60 * 60 * 1000))
    const stars = starCountByContent[item.id] ?? 0
    let reason = `${daysOld} days old`
    if (stars > 0) reason += ` · ${stars} starred output${stars > 1 ? 's' : ''}`
    if (daysOld > 180) reason += ' · Evergreen candidate'
    return { id: item.id, title: item.title, kind: item.kind, created_at: item.created_at, starred_outputs: stars, days_old: daysOld, reason }
  }).sort((a, b) => b.starred_outputs - a.starred_outputs || b.days_old - a.days_old)
}
