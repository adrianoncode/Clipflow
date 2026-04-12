'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { startDubbingJob } from '@/lib/dubbing/translate-and-dub'

const dubbingSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  target_language: z.string().min(2).max(5),
})

export interface DubJob {
  dubbingId: string
  targetLanguage: string
  startedAt: string
  status: 'processing' | 'completed' | 'failed'
}

export type StartDubbingState =
  | { ok?: undefined }
  | { ok: true; dubbingId: string; targetLanguage: string }
  | { ok: false; error: string }

export async function startDubbingAction(
  _prev: StartDubbingState,
  formData: FormData,
): Promise<StartDubbingState> {
  const parsed = dubbingSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    target_language: formData.get('target_language'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item) {
    return { ok: false, error: 'Content not found.' }
  }

  if (!item.source_url) {
    return { ok: false, error: 'No video file found. Auto-dubbing requires an uploaded video file.' }
  }

  // Get signed URL for the video
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()

  // source_url is like "videos/workspace_id/content_id/filename" for stored files
  // or a full https:// URL for YouTube/external
  let audioUrl = item.source_url
  if (!audioUrl.startsWith('http')) {
    const { data: signedData } = await supabase.storage
      .from('videos')
      .createSignedUrl(audioUrl, 3600)
    if (!signedData?.signedUrl) {
      return { ok: false, error: 'Could not generate signed URL for the video.' }
    }
    audioUrl = signedData.signedUrl
  }

  const result = await startDubbingJob({
    audioUrl,
    targetLanguage: parsed.data.target_language,
  })

  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  // Append to metadata.dub_jobs
  const existingMetadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  const existingJobs: DubJob[] = Array.isArray((existingMetadata as Record<string, unknown>).dub_jobs)
    ? ((existingMetadata as Record<string, unknown>).dub_jobs as DubJob[])
    : []

  const newJob: DubJob = {
    dubbingId: result.dubbingId,
    targetLanguage: parsed.data.target_language,
    startedAt: new Date().toISOString(),
    status: 'processing',
  }

  await supabase
    .from('content_items')
    .update({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: { ...existingMetadata, dub_jobs: [...existingJobs, newJob] } as any,
    })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  return { ok: true, dubbingId: result.dubbingId, targetLanguage: parsed.data.target_language }
}
