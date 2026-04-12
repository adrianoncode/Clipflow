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
}

export async function getUnreadNotifications(userId: string): Promise<NotificationRow[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, read, created_at')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data ?? []) as NotificationRow[]
}
