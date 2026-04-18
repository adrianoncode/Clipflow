'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReviewNotification } from '@/lib/email/send-review-notification'
import { notifyReviewComment } from '@/lib/notifications/triggers'
import { log } from '@/lib/log'

const submitCommentSchema = z.object({
  review_link_id: z.string().uuid(),
  output_id: z.string().uuid().nullable().optional(),
  reviewer_name: z.string().min(1).max(100),
  reviewer_email: z.string().email().optional().nullable(),
  body: z.string().min(1).max(2000),
})

export type SubmitCommentState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function submitReviewCommentAction(
  _prev: SubmitCommentState,
  formData: FormData,
): Promise<SubmitCommentState> {
  const parsed = submitCommentSchema.safeParse({
    review_link_id: formData.get('review_link_id'),
    output_id: formData.get('output_id') || null,
    reviewer_name: formData.get('reviewer_name'),
    reviewer_email: formData.get('reviewer_email') || null,
    body: formData.get('body'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const admin = createAdminClient()

  // Validate the review link is still active (double-check server-side).
  const { data: link } = await admin
    .from('review_links')
    .select('id, is_active, expires_at, workspace_id, content_id, label, created_by')
    .eq('id', parsed.data.review_link_id)
    .maybeSingle()

  if (!link?.is_active) return { ok: false, error: 'This review link is no longer active.' }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { ok: false, error: 'This review link has expired.' }
  }

  const { error } = await admin.from('review_comments').insert({
    review_link_id: parsed.data.review_link_id,
    output_id: parsed.data.output_id ?? null,
    reviewer_name: parsed.data.reviewer_name,
    reviewer_email: parsed.data.reviewer_email ?? null,
    body: parsed.data.body,
  })

  if (error) return { ok: false, error: error.message }

  // Fire-and-forget in-app notification for workspace owner
  try {
    void (async () => {
      try {
        const { data: content } = await admin
          .from('content_items')
          .select('title')
          .eq('id', link.content_id)
          .eq('workspace_id', link.workspace_id)
          .maybeSingle()
        notifyReviewComment({
          userId: link.created_by,
          workspaceId: link.workspace_id,
          reviewerName: parsed.data.reviewer_name,
          contentTitle: content?.title ?? 'Untitled',
          contentId: link.content_id,
        })
      } catch {}
    })()
  } catch {}

  // --- Fire email notification (non-blocking, errors are logged not thrown) ---
  void (async () => {
    try {
      // Resolve workspace owner email via admin auth API
      const { data: ownerData } = await admin.auth.admin.getUserById(link.created_by)
      const ownerEmail = ownerData?.user?.email
      if (!ownerEmail) return

      // Resolve content title
      const { data: content } = await admin
        .from('content_items')
        .select('title')
        .eq('id', link.content_id)
        .maybeSingle()

      // Resolve platform from output_id if present
      let platform: string | null = null
      if (parsed.data.output_id) {
        const { data: output } = await admin
          .from('outputs')
          .select('platform')
          .eq('id', parsed.data.output_id)
          .maybeSingle()
        platform = output?.platform ?? null
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
      const outputsUrl = `${siteUrl}/workspace/${link.workspace_id}/content/${link.content_id}/outputs`

      await sendReviewNotification({
        toEmail: ownerEmail,
        reviewerName: parsed.data.reviewer_name,
        reviewerEmail: parsed.data.reviewer_email ?? null,
        commentBody: parsed.data.body,
        contentTitle: content?.title ?? 'Untitled',
        platform,
        outputsUrl,
      })
    } catch (err) {
      log.error('review email notification failed', err)
    }
  })()

  return { ok: true }
}
