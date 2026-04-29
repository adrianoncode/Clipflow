import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import {
  initiateComposioConnection,
  isComposioOAuth,
} from '@/lib/integrations/composio'

const WORKSPACE_COOKIE = 'clipflow.current_workspace'
const SETTINGS_PATH = '/settings/channels'

/**
 * GET /api/integrations/connect?app=linkedin&workspace_id=xxx
 *
 * Kicks off a Composio OAuth flow for a publishing channel. Redirects
 * the user to the provider's OAuth consent screen. On completion,
 * Composio calls our callback route.
 *
 * Authz: verify the caller is a member of the target workspace before
 * starting the OAuth dance — otherwise a logged-in user could pass any
 * workspace_id and seed the pending cookie with it, then the callback
 * would write a connection into another tenant's workspace.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const integrationId = searchParams.get('app') ?? ''
  const workspaceId =
    searchParams.get('workspace_id') ??
    cookies().get(WORKSPACE_COOKIE)?.value ??
    ''

  if (!integrationId || !workspaceId) {
    return NextResponse.redirect(
      new URL(`${SETTINGS_PATH}?error=missing_params`, req.url),
    )
  }

  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) {
    if (check.status === 401) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.redirect(
      new URL(`${SETTINGS_PATH}?error=not_a_member`, req.url),
    )
  }

  if (!isComposioOAuth(integrationId)) {
    return NextResponse.redirect(
      new URL(`${SETTINGS_PATH}?error=not_oauth`, req.url),
    )
  }

  const pending = JSON.stringify({ workspaceId, integrationId })
  const response = await initiateComposioConnection(workspaceId, integrationId)

  if ('error' in response) {
    return NextResponse.redirect(
      new URL(
        `${SETTINGS_PATH}?error=${encodeURIComponent(response.error)}`,
        req.url,
      ),
    )
  }

  const redirect = NextResponse.redirect(response.redirectUrl)
  redirect.cookies.set('composio_pending', pending, {
    httpOnly: true,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })
  return redirect
}
