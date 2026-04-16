import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUnreadNotifications } from '@/lib/notifications/get-notifications'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get('workspace_id') ?? undefined
  const notifications = await getUnreadNotifications(user.id, workspaceId)
  return NextResponse.json(notifications)
}

export async function POST(req: NextRequest) {
  const { ids } = await req.json() as { ids: string[] }
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No notification IDs provided' }, { status: 400 })
  }
  // Cap at 50 IDs to prevent abuse
  const safeIds = ids.slice(0, 50)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .in('id', safeIds)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
