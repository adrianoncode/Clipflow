import 'server-only'

import type { OAuthConfig } from './config'

export interface TokenResponse {
  accessToken: string
  refreshToken: string | null
  expiresIn: number | null
  platformUserId: string
  platformUsername: string
}

/**
 * Exchanges an authorization code for access + refresh tokens.
 * Each platform has slightly different token exchange requirements.
 */
export async function exchangeCodeForToken(
  config: OAuthConfig,
  code: string,
): Promise<{ ok: true; token: TokenResponse } | { ok: false; error: string }> {
  switch (config.platform) {
    case 'tiktok':
      return exchangeTikTok(config, code)
    case 'instagram':
      return exchangeInstagram(config, code)
    case 'linkedin':
      return exchangeLinkedIn(config, code)
    case 'youtube':
      return exchangeYouTube(config, code)
  }
}

/* ─── TikTok ────────────────────────────────────────────────── */

async function exchangeTikTok(
  config: OAuthConfig,
  code: string,
): Promise<{ ok: true; token: TokenResponse } | { ok: false; error: string }> {
  try {
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      return { ok: false, error: data.error_description || data.error || `TikTok error ${res.status}` }
    }

    return {
      ok: true,
      token: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresIn: data.expires_in ?? null,
        platformUserId: data.open_id ?? '',
        platformUsername: data.open_id ?? 'TikTok User',
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'TikTok token exchange failed' }
  }
}

/* ─── Instagram (Facebook) ──────────────────────────────────── */

async function exchangeInstagram(
  config: OAuthConfig,
  code: string,
): Promise<{ ok: true; token: TokenResponse } | { ok: false; error: string }> {
  try {
    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || tokenData.error) {
      return { ok: false, error: tokenData.error?.message || `Instagram error ${tokenRes.status}` }
    }

    const accessToken = tokenData.access_token

    // Step 2: Get user info
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`)
    const meData = await meRes.json()

    // Step 3: Get Instagram account via pages
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`)
    const pagesData = await pagesRes.json()
    const page = pagesData.data?.[0]

    let igUsername = meData.name || 'Instagram User'
    let igUserId = meData.id || ''

    if (page) {
      // Get Instagram Business Account ID from the page
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,username}&access_token=${accessToken}`
      )
      const igData = await igRes.json()
      if (igData.instagram_business_account) {
        igUserId = igData.instagram_business_account.id
        igUsername = igData.instagram_business_account.username || igUsername
      }
    }

    return {
      ok: true,
      token: {
        accessToken,
        refreshToken: null,
        expiresIn: tokenData.expires_in ?? 5184000, // ~60 days for long-lived
        platformUserId: igUserId,
        platformUsername: igUsername,
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Instagram token exchange failed' }
  }
}

/* ─── LinkedIn ──────────────────────────────────────────────── */

async function exchangeLinkedIn(
  config: OAuthConfig,
  code: string,
): Promise<{ ok: true; token: TokenResponse } | { ok: false; error: string }> {
  try {
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      return { ok: false, error: data.error_description || data.error || `LinkedIn error ${res.status}` }
    }

    // Get user profile
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    const profile = await profileRes.json()

    return {
      ok: true,
      token: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresIn: data.expires_in ?? null,
        platformUserId: profile.sub ?? '',
        platformUsername: profile.name ?? profile.email ?? 'LinkedIn User',
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'LinkedIn token exchange failed' }
  }
}

/* ─── YouTube (Google) ──────────────────────────────────────── */

async function exchangeYouTube(
  config: OAuthConfig,
  code: string,
): Promise<{ ok: true; token: TokenResponse } | { ok: false; error: string }> {
  try {
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      return { ok: false, error: data.error_description || data.error || `YouTube error ${res.status}` }
    }

    // Get YouTube channel info
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${data.access_token}` } },
    )
    const channelData = await channelRes.json()
    const channel = channelData.items?.[0]

    return {
      ok: true,
      token: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresIn: data.expires_in ?? 3600,
        platformUserId: channel?.id ?? '',
        platformUsername: channel?.snippet?.title ?? 'YouTube Channel',
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'YouTube token exchange failed' }
  }
}
