import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { OutputPlatform } from '@/lib/supabase/types'

export interface ReviewOutput {
  id: string
  platform: OutputPlatform
  body: string | null
}

export interface ReviewComment {
  id: string
  output_id: string | null
  reviewer_name: string
  reviewer_email: string | null
  body: string
  created_at: string
}

export interface ReviewPageData {
  reviewLinkId: string
  label: string | null
  contentTitle: string | null
  outputs: ReviewOutput[]
  comments: ReviewComment[]
}

/**
 * Fetches all data needed to render the public review page.
 * Uses the admin client so no RLS complications on the public path.
 * Returns null if the token is invalid, inactive, or expired.
 */
export async function getReviewPageData(token: string): Promise<ReviewPageData | null> {
  const admin = createAdminClient()

  // 1. Resolve the token to a review link.
  const { data: link } = await admin
    .from('review_links')
    .select('id, content_id, label, is_active, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!link) return null
  if (!link.is_active) return null
  if (link.expires_at && new Date(link.expires_at) < new Date()) return null

  // 2. Fetch the content item title.
  const { data: content } = await admin
    .from('content_items')
    .select('title')
    .eq('id', link.content_id)
    .maybeSingle()

  // 3. Fetch outputs (body only — no internal metadata exposed to reviewers).
  const { data: outputs } = await admin
    .from('outputs')
    .select('id, platform, body')
    .eq('content_id', link.content_id)

  // 4. Fetch existing comments for this review link.
  const { data: comments } = await admin
    .from('review_comments')
    .select('id, output_id, reviewer_name, reviewer_email, body, created_at')
    .eq('review_link_id', link.id)
    .order('created_at', { ascending: true })

  const platformOrder: OutputPlatform[] = [
    'tiktok',
    'instagram_reels',
    'youtube_shorts',
    'linkedin',
  ]

  const sortedOutputs = (outputs ?? [])
    .map((o) => ({ id: o.id, platform: o.platform as OutputPlatform, body: o.body }))
    .sort((a, b) => platformOrder.indexOf(a.platform) - platformOrder.indexOf(b.platform))

  return {
    reviewLinkId: link.id,
    label: link.label,
    contentTitle: content?.title ?? null,
    outputs: sortedOutputs,
    comments: (comments ?? []) as ReviewComment[],
  }
}
