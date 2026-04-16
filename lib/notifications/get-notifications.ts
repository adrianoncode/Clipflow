import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface NotificationRow {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
  workspace_id: string | null
}

/**
 * Fetches unread notifications for a user.
 * Optionally filter by workspace_id to prevent cross-workspace leakage.
 */
export async function getUnreadNotifications(
  userId: string,
  workspaceId?: string,
): Promise<NotificationRow[]> {
  const supabase = createClient()
  let query = supabase
    .from('notifications')
    .select('id, type, title, body, link, read, created_at, workspace_id')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (workspaceId) {
    // Show notifications for this workspace + global ones (null workspace_id)
    query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
  }

  const { data } = await query
  return (data ?? []) as NotificationRow[]
}
