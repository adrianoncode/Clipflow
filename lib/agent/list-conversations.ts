import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export interface ConversationSummary {
  id: string
  title: string
  lastMessageAt: string
  createdAt: string
}

export async function listConversations(
  workspaceId: string,
  limit = 30,
): Promise<ConversationSummary[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data, error } = await admin
    .from('agent_conversations')
    .select('id, title, last_message_at, created_at')
    .eq('workspace_id', workspaceId)
    .order('last_message_at', { ascending: false })
    .limit(limit)

  if (error) return []

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    title: (r.title as string) || 'Untitled chat',
    lastMessageAt: r.last_message_at as string,
    createdAt: r.created_at as string,
  }))
}
