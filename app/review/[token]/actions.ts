'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

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
    .select('id, is_active, expires_at')
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

  return { ok: true }
}
