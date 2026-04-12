import { NextResponse } from 'next/server'

import { getUser } from '@/lib/auth/get-user'
import { getOAuthConfig, buildAuthorizeUrl, type OAuthPlatform } from '@/lib/oauth/config'

/**
 * GET /api/oauth/connect?platform=tiktok&workspace_id=xxx
 *
 * Redirects the user to the platform's OAuth consent screen.
 * The workspace_id is encoded in the state parameter so the callback
 * knows which workspace to store the token for.
 */
export async function GET(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') as OAuthPlatform | null
  const workspaceId = searchParams.get('workspace_id')

  if (!platform || !workspaceId) {
    return NextResponse.json({ error: 'Missing platform or workspace_id' }, { status: 400 })
  }

  const config = getOAuthConfig(platform)
  if (!config) {
    return NextResponse.json(
      { error: `${platform} OAuth not configured. Add the required env vars.` },
      { status: 400 },
    )
  }

  // Encode workspace_id + user_id in state (simple base64 JSON)
  const state = Buffer.from(
    JSON.stringify({ workspaceId, userId: user.id, platform }),
  ).toString('base64url')

  const authorizeUrl = buildAuthorizeUrl(config, state)

  return NextResponse.redirect(authorizeUrl)
}
