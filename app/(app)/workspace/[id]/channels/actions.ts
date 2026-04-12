'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { fetchYoutubeChannel } from '@/lib/content/fetch-youtube-channel'
import { fetchYoutubeTranscript } from '@/lib/content/fetch-youtube-transcript'
import { createContentItem } from '@/lib/content/create-content-item'
import { checkLimit } from '@/lib/billing/check-limit'
import type { YoutubeChannelVideo } from '@/lib/content/fetch-youtube-channel'

const scanSchema = z.object({
  workspace_id: z.string().uuid(),
  channel_url: z.string().trim().min(1, 'Enter a YouTube channel URL.').max(500),
})

const importSchema = z.object({
  workspace_id: z.string().uuid(),
  video_url: z.string().trim().min(1).max(500),
  video_title: z.string().trim().max(300),
})

export type ScanChannelState =
  | { ok?: undefined }
  | { ok: true; channelName: string; videos: YoutubeChannelVideo[] }
  | { ok: false; error: string }

export type ImportVideoState =
  | { ok?: undefined }
  | { ok: true; contentId: string }
  | { ok: false; error: string }

export async function scanChannelAction(
  _prev: ScanChannelState,
  formData: FormData,
): Promise<ScanChannelState> {
  const parsed = scanSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    channel_url: formData.get('channel_url'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const result = await fetchYoutubeChannel(parsed.data.channel_url)
  if (!result.ok) return { ok: false, error: result.error }

  return { ok: true, channelName: result.channelName, videos: result.videos }
}

export async function importVideoAction(
  _prev: ImportVideoState,
  formData: FormData,
): Promise<ImportVideoState> {
  const parsed = importSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    video_url: formData.get('video_url'),
    video_title: formData.get('video_title'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const limit = await checkLimit(parsed.data.workspace_id, 'content_items')
  if (!limit.ok) {
    return { ok: false, error: limit.message ?? 'Monthly content limit reached.' }
  }

  const fetched = await fetchYoutubeTranscript(parsed.data.video_url)
  if (!fetched.ok) return { ok: false, error: fetched.error }

  const result = await createContentItem({
    workspaceId: parsed.data.workspace_id,
    kind: 'youtube',
    title: fetched.title || parsed.data.video_title,
    status: 'ready',
    transcript: fetched.transcript,
    sourceUrl: parsed.data.video_url,
    createdBy: user.id,
  })

  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath(`/workspace/${parsed.data.workspace_id}`)
  return { ok: true, contentId: result.id }
}
