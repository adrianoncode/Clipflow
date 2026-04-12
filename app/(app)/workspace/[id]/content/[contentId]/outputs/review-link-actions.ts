'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

export type CreateReviewLinkState =
  | { ok?: undefined }
  | { ok: true; token: string }
  | { ok: false; error: string }

export async function createReviewLinkAction(
  _prev: CreateReviewLinkState,
  formData: FormData,
): Promise<CreateReviewLinkState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const contentId = formData.get('content_id')?.toString() ?? ''
  const label = formData.get('label')?.toString() || null

  if (!workspaceId || !contentId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('review_links')
    .insert({ workspace_id: workspaceId, content_id: contentId, created_by: user.id, label })
    .select('token')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create link.' }

  revalidatePath(`/workspace/${workspaceId}/content/${contentId}/outputs`)
  return { ok: true, token: data.token }
}

export type RevokeReviewLinkState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function revokeReviewLinkAction(
  _prev: RevokeReviewLinkState,
  formData: FormData,
): Promise<RevokeReviewLinkState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const contentId = formData.get('content_id')?.toString() ?? ''
  const linkId = formData.get('link_id')?.toString() ?? ''

  if (!workspaceId || !linkId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { error } = await supabase
    .from('review_links')
    .update({ is_active: false })
    .eq('id', linkId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/content/${contentId}/outputs`)
  return { ok: true }
}
