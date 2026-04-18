import { NextResponse } from 'next/server'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { createClient } from '@/lib/supabase/server'
import { getRenderStatus } from '@/lib/video/shotstack-render'
import { updateRender } from '@/lib/video/renders/update-render'

/**
 * GET /api/video/render-status?id=xxx&workspace_id=yyy
 *
 * Polls the Shotstack render status. Previously auth-gated only; the
 * renderId was trusted, so any logged-in user could poll any other
 * customer's Shotstack URL + error payload by guessing render IDs.
 *
 * Now: caller must pass workspace_id, we verify membership, and we
 * verify the render row is actually owned by that workspace before
 * touching Shotstack.
 *
 * When the render resolves (done or failed) we also upsert the
 * `public.renders` row so the UI can pick up the final URL without
 * the client having to pass it back.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const renderId = searchParams.get('id')
  const workspaceId = searchParams.get('workspace_id')

  if (!renderId || !workspaceId) {
    return NextResponse.json(
      { error: 'Missing render id or workspace_id' },
      { status: 400 },
    )
  }

  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) {
    return NextResponse.json({ error: check.message }, { status: check.status })
  }

  // Confirm this render belongs to the workspace the caller is a member of.
  const supabase = createClient()
  const { data: render } = await supabase
    .from('renders')
    .select('id')
    .eq('provider_render_id', renderId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!render) {
    return NextResponse.json({ error: 'Render not found' }, { status: 404 })
  }

  const status = await getRenderStatus(renderId, workspaceId)

  // Persist terminal states back to the DB — no-op while still rendering.
  if (status.status === 'done') {
    await updateRender({
      providerRenderId: renderId,
      status: 'done',
      url: status.url ?? null,
    })
  } else if (status.status === 'failed') {
    await updateRender({
      providerRenderId: renderId,
      status: 'failed',
      error: status.error ?? null,
    })
  }

  return NextResponse.json(status)
}
