import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/integrations/callback
 *
 * Composio redirects here after the user completes (or cancels) OAuth.
 * We mark the integration as connected in the workspace branding JSON
 * and redirect back to the integrations settings page.
 *
 * Authz: we re-check workspace membership here even though /connect
 * already did. Reason: the pending cookie is httpOnly but a user who
 * lost their membership between /connect and /callback (unlikely but
 * possible) should not be able to complete the write. Defense in
 * depth — if /connect ever regresses, the callback still holds.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const connectedAppName = searchParams.get('connectedAppName') ?? ''
  const connectionId = searchParams.get('connectionId') ?? searchParams.get('id') ?? ''

  // Read pending integration info from the cookie set in /connect
  const pendingRaw = cookies().get('composio_pending')?.value
  let workspaceId = ''
  let integrationId = ''

  if (pendingRaw) {
    try {
      const pending = JSON.parse(pendingRaw)
      workspaceId = pending.workspaceId ?? ''
      integrationId = pending.integrationId ?? ''
    } catch { /* ignore */ }
  }

  if (!workspaceId || !integrationId) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=session_expired', req.url),
    )
  }

  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) {
    if (check.status === 401) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    const res = NextResponse.redirect(
      new URL('/settings/integrations?error=not_a_member', req.url),
    )
    res.cookies.set('composio_pending', '', { maxAge: 0, path: '/' })
    return res
  }
  const user = { id: check.userId }

  if (connectionId) {
    // Persist the connectionId in workspace branding so the settings
    // page can show "Connected" without querying Composio on every load.
    const supabase = createClient()
    const { data: ws } = await supabase
      .from('workspaces')
      .select('branding')
      .eq('id', workspaceId)
      .single()

    const branding = (ws?.branding ?? {}) as Record<string, unknown>
    const integrations = (branding.integrations ?? {}) as Record<string, unknown>

    integrations[integrationId] = {
      connectionId,
      connectedAppName,
      connected_at: new Date().toISOString(),
      connected_by: user.id,
      type: 'composio',
    }

    await supabase
      .from('workspaces')
      .update({
        branding: JSON.parse(JSON.stringify({ ...branding, integrations })),
      })
      .eq('id', workspaceId)

    revalidatePath('/settings/integrations')
  }

  const settingsUrl = new URL('/settings/integrations', req.url)
  if (connectionId) {
    settingsUrl.searchParams.set('connected', integrationId)
  } else {
    settingsUrl.searchParams.set('error', 'auth_cancelled')
  }

  const res = NextResponse.redirect(settingsUrl)
  // Clear the pending cookie
  res.cookies.set('composio_pending', '', { maxAge: 0, path: '/' })
  return res
}
