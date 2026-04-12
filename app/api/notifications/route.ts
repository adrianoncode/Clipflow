import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUnreadNotifications } from '@/lib/notifications/get-notifications'

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })
  const notifications = await getUnreadNotifications(user.id)
  return NextResponse.json(notifications)
}

export async function POST(req: NextRequest) {
  // Mark notifications as read
  const { ids } = await req.json() as { ids: string[] }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await supabase.from('notifications').update({ read: true }).in('id', ids).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
