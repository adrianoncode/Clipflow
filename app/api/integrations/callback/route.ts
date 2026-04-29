import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/integrations/callback
 *
 * Composio redirects here after the user completes (or cancels) OAuth
 * for a publishing channel. We persist the connection into the
 * workspace branding JSON under `branding.channels` and redirect back
 * to /settings/channels.
 *
 * Authz: re-check workspace membership here even though /connect did.
 * Defense in depth — if /connect ever regresses, the callback still
 * holds.
 */
const SETTINGS_PATH = '/settings/channels'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const connectedAppName = searchParams.get('connectedAppName') ?? ''
  // v3 sends `connected_account_id` + `status=success`; v2 used
  // `connectionId` / `id`. Support both so downgrading the SDK later
  // wouldn't break this route.
  const connectionId =
    searchParams.get('connected_account_id') ??
    searchParams.get('connectionId') ??
    searchParams.get('id') ??
    ''
  const status = searchParams.get('status') ?? ''
  const failed = status && status !== 'success'

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
      new URL(`${SETTINGS_PATH}?error=session_expired`, req.url),
    )
  }

  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) {
    if (check.status === 401) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    const res = NextResponse.redirect(
      new URL(`${SETTINGS_PATH}?error=not_a_member`, req.url),
    )
    res.cookies.set('composio_pending', '', { maxAge: 0, path: '/' })
    return res
  }
  const user = { id: check.userId }

  if (connectionId && !failed) {
    const supabase = createClient()
    const { data: ws } = await supabase
      .from('workspaces')
      .select('branding')
      .eq('id', workspaceId)
      .single()

    const branding = (ws?.branding ?? {}) as Record<string, unknown>
    const channels = (branding.channels ?? {}) as Record<string, unknown>

    channels[integrationId] = {
      connectionId,
      connectedAppName,
      connected_at: new Date().toISOString(),
      connected_by: user.id,
      type: 'composio',
    }

    await supabase
      .from('workspaces')
      .update({
        branding: JSON.parse(JSON.stringify({ ...branding, channels })),
      })
      .eq('id', workspaceId)

    revalidatePath(SETTINGS_PATH)
  }

  const settingsUrl = new URL(SETTINGS_PATH, req.url)
  if (connectionId && !failed) {
    settingsUrl.searchParams.set('connected', integrationId)
  } else {
    settingsUrl.searchParams.set('error', 'auth_cancelled')
  }

  const res = NextResponse.redirect(settingsUrl)
  res.cookies.set('composio_pending', '', { maxAge: 0, path: '/' })
  return res
}
