/**
 * OAuth configuration for social platform connections.
 * Client IDs and secrets come from environment variables.
 */

export type OAuthPlatform = 'tiktok' | 'instagram' | 'linkedin' | 'youtube'

export interface OAuthConfig {
  platform: OAuthPlatform
  clientId: string
  clientSecret: string
  authorizeUrl: string
  tokenUrl: string
  scopes: string[]
  /** Our callback URL */
  redirectUri: string
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export function getOAuthConfig(platform: OAuthPlatform): OAuthConfig | null {
  switch (platform) {
    case 'tiktok': {
      const clientId = process.env.TIKTOK_CLIENT_KEY
      const clientSecret = process.env.TIKTOK_CLIENT_SECRET
      if (!clientId || !clientSecret) return null
      return {
        platform,
        clientId,
        clientSecret,
        authorizeUrl: 'https://www.tiktok.com/v2/auth/authorize/',
        tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
        scopes: ['user.info.basic', 'video.publish', 'video.upload'],
        redirectUri: `${BASE_URL}/api/oauth/tiktok/callback`,
      }
    }

    case 'instagram': {
      const clientId = process.env.FACEBOOK_APP_ID
      const clientSecret = process.env.FACEBOOK_APP_SECRET
      if (!clientId || !clientSecret) return null
      return {
        platform,
        clientId,
        clientSecret,
        authorizeUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
        scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'],
        redirectUri: `${BASE_URL}/api/oauth/instagram/callback`,
      }
    }

    case 'linkedin': {
      const clientId = process.env.LINKEDIN_CLIENT_ID
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
      if (!clientId || !clientSecret) return null
      return {
        platform,
        clientId,
        clientSecret,
        authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        scopes: ['openid', 'profile', 'w_member_social'],
        redirectUri: `${BASE_URL}/api/oauth/linkedin/callback`,
      }
    }

    case 'youtube': {
      // YouTube uses Google OAuth — same credentials as Google Cloud project
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET
      if (!clientId || !clientSecret) return null
      return {
        platform,
        clientId,
        clientSecret,
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: [
          'https://www.googleapis.com/auth/youtube.upload',
          'https://www.googleapis.com/auth/youtube.readonly',
          'https://www.googleapis.com/auth/userinfo.profile',
        ],
        redirectUri: `${BASE_URL}/api/oauth/youtube/callback`,
      }
    }
  }
}

/**
 * Builds the OAuth authorization URL for a platform.
 * The state parameter includes the workspace ID for the callback to use.
 */
export function buildAuthorizeUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams()

  if (config.platform === 'tiktok') {
    params.set('client_key', config.clientId)
    params.set('redirect_uri', config.redirectUri)
    params.set('scope', config.scopes.join(','))
    params.set('response_type', 'code')
    params.set('state', state)
    return `${config.authorizeUrl}?${params.toString()}`
  }

  // Instagram (Facebook) & LinkedIn follow standard OAuth 2.0
  params.set('client_id', config.clientId)
  params.set('redirect_uri', config.redirectUri)
  params.set('scope', config.scopes.join(' '))
  params.set('response_type', 'code')
  params.set('state', state)

  return `${config.authorizeUrl}?${params.toString()}`
}
