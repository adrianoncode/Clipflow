export const dynamic = 'force-dynamic'
export const metadata = { title: 'Subtitles' }

import { notFound } from 'next/navigation'

import { SubtitlesClient } from '@/components/content/subtitles-client'
import { getContentItem } from '@/lib/content/get-content-item'
import { getSignedUrl } from '@/lib/content/get-signed-url'
import type { SubtitleCue } from '@/lib/subtitles/generate-subtitles'
import type { WordTimestamp } from '@/lib/ai/transcription/transcribe-with-timestamps'

interface SubtitlesPageProps {
  params: { id: string; contentId: string }
}

export default async function SubtitlesPage({ params }: SubtitlesPageProps) {
  const { id: workspaceId, contentId } = params

  const item = await getContentItem(contentId, workspaceId)
  if (!item) notFound()

  // Get a signed video URL if the item is an uploaded video
  let videoUrl: string | null = null
  if (item.kind === 'video' && item.source_url) {
    const needsSign = !item.source_url.startsWith('http')
    videoUrl = needsSign ? await getSignedUrl(item.source_url) : item.source_url
  }

  // Extract existing subtitle data from metadata if already generated
  const meta =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  const initialCues = Array.isArray(meta.subtitle_cues)
    ? (meta.subtitle_cues as SubtitleCue[])
    : null

  const initialSrt = typeof meta.srt === 'string' ? meta.srt : null
  const initialVtt = typeof meta.vtt === 'string' ? meta.vtt : null

  const wordTimestamps = Array.isArray(meta.word_timestamps)
    ? (meta.word_timestamps as WordTimestamp[])
    : null

  return (
    <SubtitlesClient
      workspaceId={workspaceId}
      contentId={contentId}
      videoUrl={videoUrl}
      initialCues={initialCues}
      initialSrt={initialSrt}
      initialVtt={initialVtt}
      wordTimestamps={wordTimestamps}
    />
  )
}
