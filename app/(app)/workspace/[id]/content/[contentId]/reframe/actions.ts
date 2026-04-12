'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { getSignedUrl } from '@/lib/content/get-signed-url'
import { startReframeJob } from '@/lib/reframe/reframe-video'
import { createClient } from '@/lib/supabase/server'

const reframeSchema = z.object({
  workspaceId: z.string().uuid(),
  contentId: z.string().uuid(),
  aspectRatio: z.enum(['9:16', '1:1', '4:5']).default('9:16'),
})

export type StartReframeState =
  | { ok?: undefined }
  | { ok: true; jobId: string }
  | { ok: false; error: string }

export async function startReframeAction(
  _prev: StartReframeState,
  formData: FormData,
): Promise<StartReframeState> {
  const parsed = reframeSchema.safeParse({
    workspaceId: formData.get('workspaceId'),
    contentId: formData.get('contentId'),
    aspectRatio: formData.get('aspectRatio') ?? '9:16',
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const { workspaceId, contentId, aspectRatio } = parsed.data

  const item = await getContentItem(contentId, workspaceId)
  if (!item) return { ok: false, error: 'Content item not found.' }
  if (item.kind !== 'video' || !item.source_url) {
    return { ok: false, error: 'Only video content with a source file can be reframed.' }
  }

  // Get signed URL for the video
  const needsSignedUrl = !item.source_url.startsWith('http')
  const signedUrl = needsSignedUrl
    ? await getSignedUrl(item.source_url)
    : item.source_url

  if (!signedUrl) return { ok: false, error: 'Could not generate signed URL for video.' }

  // Start the Replicate job
  const result = await startReframeJob(signedUrl, aspectRatio)
  if (!result.ok) return { ok: false, error: result.error }

  // Store jobId in content_items.metadata.reframe_job
  const supabase = createClient()

  const existingMetadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  const updatedMetadata = {
    ...existingMetadata,
    reframe_job: {
      jobId: result.jobId,
      aspectRatio,
      startedAt: new Date().toISOString(),
    },
  }

  const { error: updateError } = await supabase
    .from('content_items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ metadata: updatedMetadata as any })
    .eq('id', contentId)
    .eq('workspace_id', workspaceId)

  if (updateError) {
    // Non-fatal: job started successfully even if we can't persist the jobId
    console.error('[startReframeAction] Failed to persist jobId:', updateError.message)
  }

  return { ok: true, jobId: result.jobId }
}
