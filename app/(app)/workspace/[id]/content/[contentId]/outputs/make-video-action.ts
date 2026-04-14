'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { checkRenderQuota } from '@/lib/billing/check-feature'
import { makeVideoPipeline } from '@/lib/video/make-video-pipeline'

const makeVideoSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  aspect_ratio: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
  music_url: z.string().url().optional().or(z.literal('')),
})

export type MakeVideoState =
  | { ok?: undefined }
  | { ok: true; renderId: string; renderRowId: string | null }
  | { ok: false; error: string }

/**
 * One-click "make video" — the server action bound to the big button
 * on the outputs page. Checks quota, then runs the pipeline. Quota
 * rejections never touch Shotstack.
 */
export async function makeVideoAction(
  _prev: MakeVideoState,
  formData: FormData,
): Promise<MakeVideoState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const parsed = makeVideoSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    aspect_ratio: formData.get('aspect_ratio') ?? '9:16',
    music_url: formData.get('music_url') || '',
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const gate = await checkRenderQuota(parsed.data.workspace_id, 'video_render')
  if (!gate.ok) return { ok: false, error: gate.message ?? 'Render quota reached.' }

  const result = await makeVideoPipeline({
    workspaceId: parsed.data.workspace_id,
    contentId: parsed.data.content_id,
    aspectRatio: parsed.data.aspect_ratio,
    musicUrl: parsed.data.music_url || null,
  })

  return result
}
