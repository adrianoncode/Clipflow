import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { escapePostgrestIlikeValue } from '@/lib/security/postgrest-escape'

export interface SearchResult {
  type: 'content' | 'output'
  id: string
  title: string
  excerpt: string
  url: string
  platform?: string
  status?: string
  created_at: string
}

export async function searchWorkspace(workspaceId: string, query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.length < 2) return []
  const supabase = createClient()
  // Escape user input — PostgREST treats `, ( ) . : *` as filter-syntax
  // delimiters. Without escaping, an attacker can inject extra filter
  // clauses inside `.or()` and bypass the workspace scope on matching rows.
  const q = escapePostgrestIlikeValue(query.toLowerCase())
  if (!q) return []
  const wildcard = `%${q}%`

  const [contentRes, outputRes] = await Promise.all([
    supabase
      .from('content_items')
      .select('id, title, status, kind, created_at, transcript')
      .eq('workspace_id', workspaceId)
      .or(`title.ilike.${wildcard},transcript.ilike.${wildcard}`)
      .limit(10),
    supabase
      .from('outputs')
      .select('id, platform, body, created_at, content_id')
      .eq('workspace_id', workspaceId)
      .ilike('body', wildcard)
      .limit(10),
  ])

  const contentResults: SearchResult[] = (contentRes.data ?? []).map(item => ({
    type: 'content' as const,
    id: item.id,
    title: (item.title as string | null) ?? 'Untitled',
    excerpt: (item.transcript as string | null)
      ? (item.transcript as string).slice(0, 120).replace(/\s+/g, ' ') + '...'
      : '',
    url: `/workspace/${workspaceId}/content/${item.id}`,
    status: item.status as string | undefined,
    created_at: item.created_at as string,
  }))

  const outputResults: SearchResult[] = (outputRes.data ?? []).map(o => {
    const body = (o.body as string) ?? ''
    const idx = body.toLowerCase().indexOf(q)
    const start = Math.max(0, idx - 40)
    const excerpt = body.slice(start, start + 120).replace(/\s+/g, ' ') + '...'
    return {
      type: 'output' as const,
      id: o.id as string,
      title: `${o.platform as string} draft`,
      excerpt,
      url: `/workspace/${workspaceId}/content/${o.content_id as string}/outputs`,
      platform: o.platform as string,
      created_at: o.created_at as string,
    }
  })

  return [...contentResults, ...outputResults].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}
