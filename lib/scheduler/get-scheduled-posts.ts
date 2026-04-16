import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface ScheduledPostRow {
  id: string
  platform: string
  scheduled_for: string
  status: string
  published_at: string | null
  error_message: string | null
  output_id: string
  platform_post_id: string | null
  metadata: Record<string, unknown> | null
  outputs: {
    body: string | null
    content_items: { title: string | null } | null
  } | null
}

export async function getScheduledPosts(workspaceId: string): Promise<ScheduledPostRow[]> {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('id, platform, scheduled_for, status, published_at, error_message, output_id, platform_post_id, metadata')
    .eq('workspace_id', workspaceId)
    .order('scheduled_for', { ascending: true })
    .limit(50)

  if (!posts?.length) return []

  const outputIds = [...new Set(posts.map((p) => p.output_id))]
  const { data: outputs } = await supabase
    .from('outputs')
    .select('id, body, content_id')
    .in('id', outputIds)

  const contentIds = [...new Set((outputs ?? []).map((o) => o.content_id))]
  const { data: contents } = await supabase
    .from('content_items')
    .select('id, title')
    .in('id', contentIds)

  const contentTitleMap = new Map<string, string | null>()
  for (const c of contents ?? []) contentTitleMap.set(c.id, c.title)

  const outputMap = new Map<string, { body: string | null; content_items: { title: string | null } | null }>()
  for (const o of outputs ?? []) {
    outputMap.set(o.id, {
      body: o.body,
      content_items: { title: contentTitleMap.get(o.content_id) ?? null },
    })
  }

  return posts.map((p) => ({
    id: p.id,
    platform: p.platform,
    scheduled_for: p.scheduled_for,
    status: p.status,
    published_at: p.published_at,
    error_message: p.error_message,
    output_id: p.output_id,
    platform_post_id: p.platform_post_id,
    metadata: (p.metadata as Record<string, unknown>) ?? null,
    outputs: outputMap.get(p.output_id) ?? null,
  }))
}
