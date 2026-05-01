import { NextRequest, NextResponse } from 'next/server'

import { verifyExtensionToken } from '@/lib/extension-tokens'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  // IP rate limit before any DB work — without this an attacker can
  // flood random bearer values at us and burn DB QPS.
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const rl = await checkRateLimit(`extension-auth:ip:${ip}`, 30, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429 },
    )
  }

  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const plaintext = auth.replace('Bearer ', '').trim()
  const verified = await verifyExtensionToken(plaintext)
  if (!verified.ok) {
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
  }

  // Tokens are user-scoped, not session-scoped — read the user's
  // memberships via the admin client.
  const admin = createAdminClient()
  type WorkspaceRef = { id: string; name: string; type: string } | null
  type MemberRow = { workspace_id: string; role: string; workspaces: WorkspaceRef }

  const { data: memberships } = await admin
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, type)')
    .eq('user_id', verified.userId)

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
