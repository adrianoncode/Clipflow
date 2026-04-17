'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { generateAvatarVideo } from '@/lib/avatar/generate-avatar-video'
import type { AvatarVideoResult } from '@/lib/avatar/generate-avatar-video'
import { checkRenderQuota } from '@/lib/billing/check-feature'
import { checkWorkspaceRateLimit } from '@/lib/rate-limit-helper'

const avatarSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  script_override: z.string().max(1500).optional(),
})

export type GenerateAvatarState =
  | { ok?: undefined }
  | { ok: true; jobId: string; status: AvatarVideoResult['status']; videoUrl?: string }
  | { ok: false; error: string }

export async function generateAvatarAction(
  _prev: GenerateAvatarState,
  formData: FormData,
): Promise<GenerateAvatarState> {
  const parsed = avatarSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    script_override: formData.get('script_override') || undefined,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const rl = await checkWorkspaceRateLimit(parsed.data.workspace_id, 'videoJob')
  if (!rl.ok) return { ok: false, error: rl.error }

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item) {
    return { ok: false, error: 'Content not found.' }
  }

  const script = parsed.data.script_override ?? (item.transcript?.slice(0, 1500) ?? '')
  if (!script) {
    return { ok: false, error: 'No script available. Add a transcript or provide a custom script.' }
  }

  // Avatar videos are the most expensive per-use (Replicate/HeyGen) —
  // gated separately from regular video renders.
  const quota = await checkRenderQuota(parsed.data.workspace_id, 'avatar_video')
  if (!quota.ok) {
    return { ok: false, error: quota.message ?? 'Avatar quota reached.' }
  }

  const result = await generateAvatarVideo({ script })

  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  // Store job in metadata
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const existingMetadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  await supabase
    .from('content_items')
    .update({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: { ...existingMetadata, avatar_job: { jobId: result.jobId, status: result.status, startedAt: new Date().toISOString() } } as any,
    })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  return { ok: true, jobId: result.jobId, status: result.status, videoUrl: result.videoUrl }
}
