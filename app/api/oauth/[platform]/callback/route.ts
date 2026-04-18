import { NextResponse } from 'next/server'

import { getOAuthConfig, type OAuthPlatform } from '@/lib/oauth/config'
import { exchangeCodeForToken } from '@/lib/oauth/exchange-token'
import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * GET /api/oauth/:platform/callback?code=xxx&state=xxx
 *
 * OAuth callback handler for TikTok, Instagram, and LinkedIn.
 * Exchanges the auth code for tokens, stores them in social_accounts,
 * and redirects back to the scheduler connect page.
 */
export async function GET(
  request: Request,
  { params }: { params: { platform: string } },
) {
  const platform = params.platform as OAuthPlatform
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // User denied access
  if (error) {
    return NextResponse.redirect(
      `${BASE_URL}/dashboard?error=${encodeURIComponent(`${platform} connection cancelled`)}`,
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${BASE_URL}/dashboard?error=${encodeURIComponent('Missing authorization code')}`,
    )
  }

  // Decode state
  let stateData: { workspaceId: string; userId: string; platform: string }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
  } catch {
    return NextResponse.redirect(
      `${BASE_URL}/dashboard?error=${encodeURIComponent('Invalid state parameter')}`,
    )
  }

  const config = getOAuthConfig(platform)
  if (!config) {
    return NextResponse.redirect(
      `${BASE_URL}/dashboard?error=${encodeURIComponent(`${platform} OAuth not configured`)}`,
    )
  }

  // Exchange code for tokens
  const result = await exchangeCodeForToken(config, code)
  if (!result.ok) {
    return NextResponse.redirect(
      `${BASE_URL}/workspace/${stateData.workspaceId}/schedule/connect?error=${encodeURIComponent(result.error)}`,
    )
  }

  const { token } = result

  // Store in social_accounts (upsert by workspace + platform + user)
  const supabase = await createClient()

  const expiresAt = token.expiresIn
    ? new Date(Date.now() + token.expiresIn * 1000).toISOString()
    : null

  // Delete existing connection for this platform in this workspace
  await supabase
    .from('social_accounts')
    .delete()
    .eq('workspace_id', stateData.workspaceId)
    .eq('platform', platform)

  // Insert new connection
  const { error: insertError } = await supabase
    .from('social_accounts')
    .insert({
      workspace_id: stateData.workspaceId,
      user_id: stateData.userId,
      platform,
      platform_user_id: token.platformUserId,
      platform_username: token.platformUsername,
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expires_at: expiresAt,
    })

  if (insertError) {
    log.error('oauth callback insert error', insertError)
    return NextResponse.redirect(
      `${BASE_URL}/workspace/${stateData.workspaceId}/schedule/connect?error=${encodeURIComponent('Failed to save connection')}`,
    )
  }

  // Success — redirect to scheduler
  return NextResponse.redirect(
    `${BASE_URL}/workspace/${stateData.workspaceId}/schedule/connect?connected=${platform}`,
  )
}
