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
    const { error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      workspace_id: params.workspaceId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    })

    if (error) {
      // eslint-disable-next-line no-console
      console.warn(`[createNotification] DB error for ${params.type}:`, error.message)
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      '[createNotification] Unexpected error:',
      err instanceof Error ? err.message : 'unknown',
    )
  }
}
