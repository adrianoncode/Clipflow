import 'server-only'

export interface PublishResult {
  ok: boolean
  platformPostId?: string
  error?: string
}

export async function publishToTikTok(
  accessToken: string,
  caption: string,
  videoUrl?: string,
): Promise<PublishResult> {
  // TODO: Implement TikTok Content Posting API v2
  // Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
  // Requires: TikTok Developer App + user OAuth
  if (!accessToken) return { ok: false, error: 'TikTok not connected' }
  // Stub: simulate success
  void caption
  void videoUrl
  return { ok: true, platformPostId: `tiktok_stub_${Date.now()}` }
}

export async function publishToInstagram(
  accessToken: string,
  caption: string,
  imageUrl?: string,
): Promise<PublishResult> {
  // TODO: Implement Meta Graph API for Instagram
  // Docs: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
  if (!accessToken) return { ok: false, error: 'Instagram not connected' }
  void caption
  void imageUrl
  return { ok: true, platformPostId: `ig_stub_${Date.now()}` }
}

export async function publishToLinkedIn(
  accessToken: string,
  text: string,
): Promise<PublishResult> {
  // TODO: Implement LinkedIn Share API v2
  // Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
  if (!accessToken) return { ok: false, error: 'LinkedIn not connected' }
  void text
  return { ok: true, platformPostId: `li_stub_${Date.now()}` }
}

export async function publishPost(
  platform: string,
  accessToken: string,
  content: string,
  mediaUrl?: string,
): Promise<PublishResult> {
  switch (platform) {
    case 'tiktok':
      return publishToTikTok(accessToken, content, mediaUrl)
    case 'instagram':
      return publishToInstagram(accessToken, content, mediaUrl)
    case 'linkedin':
      return publishToLinkedIn(accessToken, content)
    default:
      return { ok: false, error: `Unknown platform: ${platform}` }
  }
}
