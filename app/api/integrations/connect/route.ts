import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { getUser } from '@/lib/auth/get-user'
import { initiateComposioConnection, isComposioOAuth } from '@/lib/integrations/composio'

const WORKSPACE_COOKIE = 'clipflow.current_workspace'

/**
 * GET /api/integrations/connect?app=notion&workspace_id=xxx
 *
 * Kicks off a Composio OAuth flow. Redirects the user to the provider's
 * OAuth consent screen. On completion, Composio calls our callback route.
 */
export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const { searchParams } = new URL(req.url)
  const integrationId = searchParams.get('app') ?? ''
  const workspaceId =
    searchParams.get('workspace_id') ??
    cookies().get(WORKSPACE_COOKIE)?.value ??
    ''

  if (!integrationId || !workspaceId) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=missing_params', req.url),
    )
  }

  if (!isComposioOAuth(integrationId)) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=not_oauth', req.url),
    )
  }

  // Store workspace + integrationId in a short-lived cookie so the
  // callback route knows where to save the connection.
  const pending = JSON.stringify({ workspaceId, integrationId })
  const response = await initiateComposioConnection(workspaceId, integrationId)

  if ('error' in response) {
    return NextResponse.redirect(
      new URL(
        `/settings/integrations?error=${encodeURIComponent(response.error)}`,
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
