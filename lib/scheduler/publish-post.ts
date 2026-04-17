import 'server-only'

/**
 * ──────────────────────────────────────────────────────────────────────
 *  Direct-OAuth publishing — INTENTIONALLY NOT IMPLEMENTED
 * ──────────────────────────────────────────────────────────────────────
 *
 *  Clipflow's supported publishing path is **Upload-Post BYOK** — see
 *  `lib/publish/upload-post.ts`. Upload-Post handles the per-platform
 *  OAuth (TikTok Content Posting v2, Meta Graph, LinkedIn Share v2) and
 *  exposes a single `/post` endpoint that fans out to all connected
 *  accounts.
 *
 *  We deliberately DO NOT maintain our own TikTok/Meta/LinkedIn app
 *  registrations because:
 *    1. Each platform requires a separate app review process (weeks)
 *    2. Token refresh and rate-limit handling differ per platform
 *    3. Upload-Post already does this at $16/mo — cheaper than building
 *
 *  These functions remain as typed stubs so the scheduled-publish cron
 *  job compiles; they always return `ok: false` so no scheduled post
 *  can silently appear as "published" without actually being sent.
 *
 *  If you want to support direct OAuth in the future, replace each stub
 *  with a real implementation — don't reintroduce fake success IDs.
 */

export interface PublishResult {
  ok: boolean
  platformPostId?: string
  error?: string
}

const NOT_IMPLEMENTED: PublishResult = {
  ok: false,
  error:
    'Direct publishing not supported — connect Upload-Post under Settings → AI Connections → Publishing to schedule posts.',
}

export async function publishToTikTok(
  _accessToken: string,
  _caption: string,
  _videoUrl?: string,
): Promise<PublishResult> {
  return NOT_IMPLEMENTED
}

export async function publishToInstagram(
  _accessToken: string,
  _caption: string,
  _imageUrl?: string,
): Promise<PublishResult> {
  return NOT_IMPLEMENTED
}

export async function publishToLinkedIn(
  _accessToken: string,
  _text: string,
): Promise<PublishResult> {
  return NOT_IMPLEMENTED
}

export async function publishPost(
  platform: string,
  _accessToken: string,
  _content: string,
  _mediaUrl?: string,
): Promise<PublishResult> {
  switch (platform) {
    case 'tiktok':
    case 'instagram':
    case 'linkedin':
    case 'youtube':
    case 'youtube_shorts':
      return NOT_IMPLEMENTED
    default:
      return { ok: false, error: `Unknown platform: ${platform}` }
  }
}
