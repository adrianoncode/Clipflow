import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const token = auth.replace('Bearer ', '')
  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
  }

  type WorkspaceRef = { id: string; name: string; type: string } | null
  type MemberRow = { workspace_id: string; role: string; workspaces: WorkspaceRef }

  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, type)')
    .eq('user_id', user.id)

  const rows = (memberships ?? []) as unknown as MemberRow[]

  const workspaces = rows
    .filter((m) => m.workspaces !== null)
    .map((m) => ({
      id: (m.workspaces as NonNullable<WorkspaceRef>).id,
      name: (m.workspaces as NonNullable<WorkspaceRef>).name,
      type: (m.workspaces as NonNullable<WorkspaceRef>).type,
      role: m.role,
    }))

  return NextResponse.json({ ok: true, workspaces })
}
