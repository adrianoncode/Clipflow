import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

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
    const { error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      workspace_id: params.workspaceId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    })

    if (error) {
      log.warn('createNotification db error', { type: params.type, error: error.message })
    }
  } catch (err) {
    log.warn('createNotification unexpected error', {
      type: params.type,
      error: err instanceof Error ? err.message : 'unknown',
    })
  }
}
