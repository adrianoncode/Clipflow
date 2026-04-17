/**
 * Single source of truth for platform constants.
 *
 * Two distinct platform concepts exist in Clipflow:
 *
 *   1. **Output platforms** (`OutputPlatform`) — the platforms we generate
 *      drafts for. Short-form only: TikTok, Instagram Reels, YouTube
 *      Shorts, LinkedIn. Used in `outputs`, `output_states`, `content_items`
 *      pipeline tables.
 *
 *   2. **Publish platforms** (`PublishPlatform`) — the Upload-Post account
 *      targets. Plain platform names because Upload-Post doesn't
 *      distinguish between Instagram-feed and Reels at the API layer.
 *
 * When rendering a scheduled_post row, you'll see BOTH shapes — e.g. a
 * linkedin output gets scheduled as platform="linkedin" (same),
 * but an instagram_reels output gets scheduled as platform="instagram".
 * All helper maps below accept the union of both.
 */

// ─── Output platforms (content-repurposing draft targets) ───────────────
export const OUTPUT_PLATFORMS = [
  'tiktok',
  'instagram_reels',
  'youtube_shorts',
  'linkedin',
] as const
export type OutputPlatform = (typeof OUTPUT_PLATFORMS)[number]

// ─── Publish platforms (Upload-Post account targets) ────────────────────
export const PUBLISH_PLATFORMS = [
  'tiktok',
  'instagram',
  'youtube',
  'linkedin',
] as const
export type PublishPlatform = (typeof PUBLISH_PLATFORMS)[number]

/** Superset of both — used for generic mapping (scheduled_posts.platform). */
export type AnyPlatform = OutputPlatform | PublishPlatform

// ─── Labels ─────────────────────────────────────────────────────────────
/**
 * The maps below are typed as `Record<string, string>` (not
 * `Record<AnyPlatform, string>`) so callers can look up by arbitrary
 * strings coming from the DB — e.g. `scheduled_posts.platform` is a
 * free-form text column. Use the `platformLabel()` helper when you
 * want a typed fallback, or just index with `?? 'default'` inline.
 *
 * The keys we actually populate still cover every `AnyPlatform` — the
 * looser type is only for the *access* side, not the *definition* side.
 */

/**
 * Short, UI-facing labels. Matches how each platform brands its short-form
 * product today ("Reels", "Shorts"). Use this by default in UI.
 */
export const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  instagram_reels: 'Reels',
  youtube: 'YouTube',
  youtube_shorts: 'Shorts',
  linkedin: 'LinkedIn',
}

/**
 * Long/explicit labels ("Instagram Reels", "YouTube Shorts"). Use in
 * long-form contexts: emails, review pages, exported filenames.
 */
export const PLATFORM_LONG_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  instagram_reels: 'Instagram Reels',
  youtube: 'YouTube',
  youtube_shorts: 'YouTube Shorts',
  linkedin: 'LinkedIn',
}

// ─── Colors ─────────────────────────────────────────────────────────────
/** Solid brand color (bg + white text) for badges on colored backgrounds. */
export const PLATFORM_SOLID_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-500 text-white',
  instagram: 'bg-purple-500 text-white',
  instagram_reels: 'bg-purple-500 text-white',
  youtube: 'bg-red-500 text-white',
  youtube_shorts: 'bg-red-500 text-white',
  linkedin: 'bg-blue-600 text-white',
}

/** Soft background for chip-style badges on light surfaces. */
export const PLATFORM_SOFT_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-100 text-pink-700',
  instagram: 'bg-purple-100 text-purple-700',
  instagram_reels: 'bg-purple-100 text-purple-700',
  youtube: 'bg-red-100 text-red-700',
  youtube_shorts: 'bg-red-100 text-red-700',
  linkedin: 'bg-blue-100 text-blue-700',
}

/** Dot-only / bar-only brand color (no text color). */
export const PLATFORM_DOT_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-500',
  instagram: 'bg-purple-500',
  instagram_reels: 'bg-purple-500',
  youtube: 'bg-red-500',
  youtube_shorts: 'bg-red-500',
  linkedin: 'bg-blue-500',
}

// ─── Helpers ────────────────────────────────────────────────────────────
/** Safe lookup — returns a human-readable label even for unknown platform ids. */
export function platformLabel(platform: string | null | undefined): string {
  if (!platform) return 'Unknown'
  return PLATFORM_LABELS[platform as AnyPlatform] ?? platform
}

export function platformLongLabel(platform: string | null | undefined): string {
  if (!platform) return 'Unknown'
  return PLATFORM_LONG_LABELS[platform as AnyPlatform] ?? platform
}

/** Maps an OutputPlatform to the Upload-Post PublishPlatform. */
export function outputToPublishPlatform(p: OutputPlatform): PublishPlatform {
  switch (p) {
    case 'tiktok':
      return 'tiktok'
    case 'instagram_reels':
      return 'instagram'
    case 'youtube_shorts':
      return 'youtube'
    case 'linkedin':
      return 'linkedin'
  }
}
