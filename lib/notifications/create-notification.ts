import 'server-only'
import { createClient } from '@/lib/supabase/server'

export async function createNotification(params: {
  userId: string
  workspaceId?: string
  type: string
  title: string
  body?: string
  link?: string
}) {
  try {
    const supabase = createClient()
    await supabase.from('notifications').insert({
      user_id: params.userId,
      workspace_id: params.workspaceId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    })
  } catch {
    // notifications are non-critical, never throw
  }
}
