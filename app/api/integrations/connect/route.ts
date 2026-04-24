import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import {
  initiateComposioConnection,
  isComposioChannel,
  isComposioOAuth,
} from '@/lib/integrations/composio'

const WORKSPACE_COOKIE = 'clipflow.current_workspace'

type Scope = 'channel' | 'integration'

function scopeSettingsPath(scope: Scope): string {
  return scope === 'channel' ? '/settings/channels' : '/settings/integrations'
}

/**
 * GET /api/integrations/connect?app=notion&workspace_id=xxx
 *
 * Kicks off a Composio OAuth flow. Redirects the user to the provider's
 * OAuth consent screen. On completion, Composio calls our callback
 * route.
 *
 * Authz: previously auth-only — a logged-in user could pass any
 * workspace_id and seed the pending cookie with it. The callback then
 * wrote to that workspace's integrations config. Now we verify the
 * caller is a member of the target workspace before starting the
 * OAuth dance.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const integrationId = searchParams.get('app') ?? ''
  const workspaceId =
    searchParams.get('workspace_id') ??
    cookies().get(WORKSPACE_COOKIE)?.value ??
    ''

  // Scope defaults by integration type: social platforms → channel,
  // everything else → integration. An explicit ?scope= param wins so
  // we can force-override if needed later.
  const paramScope = searchParams.get('scope')
  const scope: Scope =
    paramScope === 'channel' || paramScope === 'integration'
      ? paramScope
      : isComposioChannel(integrationId)
        ? 'channel'
        : 'integration'
  const settingsPath = scopeSettingsPath(scope)

  if (!integrationId || !workspaceId) {
    return NextResponse.redirect(
      new URL(`${settingsPath}?error=missing_params`, req.url),
    )
  }

  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) {
    if (check.status === 401) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.redirect(
      new URL(`${settingsPath}?error=not_a_member`, req.url),
    )
  }

  if (!isComposioOAuth(integrationId)) {
    return NextResponse.redirect(
      new URL(`${settingsPath}?error=not_oauth`, req.url),
    )
  }

  // Store workspace + integrationId + scope in a short-lived cookie
  // so the callback route knows where to save the connection.
  const pending = JSON.stringify({ workspaceId, integrationId, scope })
  const response = await initiateComposioConnection(workspaceId, integrationId)

  if ('error' in response) {
    return NextResponse.redirect(
      new URL(
        `${settingsPath}?error=${encodeURIComponent(response.error)}`,
        req.url,
      ),
    )
  }

  const redirect = NextResponse.redirect(response.redirectUrl)
  redirect.cookies.set('composio_pending', pending, {
    httpOnly: true,
    maxAge: 600, // 10 minutes
    path: '/',
    sameSite: 'lax',
  })
  return redirect
}
