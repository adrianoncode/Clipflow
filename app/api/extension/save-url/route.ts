import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Validate Authorization header
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: { url?: string; title?: string; workspaceId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { url, title, workspaceId } = body

  if (!url || !workspaceId) {
    return NextResponse.json({ ok: false, error: 'Missing url or workspaceId' }, { status: 400 })
  }

  const token = auth.replace('Bearer ', '')
  const supabase = createClient()

  // Verify the token by getting user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
  }

  // Verify workspace membership
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ ok: false, error: 'Not a workspace member' }, { status: 403 })
  }

  // Create content item
  const { data: item, error } = await supabase
    .from('content_items')
    .insert({
      workspace_id: workspaceId,
      kind: 'url',
      status: 'processing',
      title: title || url,
      source_url: url,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !item) {
    return NextResponse.json({ ok: false, error: 'Failed to create content item' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, contentId: item.id })
}
