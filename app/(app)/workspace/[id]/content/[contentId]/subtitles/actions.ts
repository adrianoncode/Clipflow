'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { getContentItem } from '@/lib/content/get-content-item'
import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'
import { transcribeWithTimestamps } from '@/lib/ai/transcription/transcribe-with-timestamps'
import { checkWorkspaceRateLimit } from '@/lib/rate-limit-helper'
import {
  buildSubtitleCues,
  buildEstimatedCues,
  generateSrt,
  generateVtt,
} from '@/lib/subtitles/generate-subtitles'
import type { SubtitleCue } from '@/lib/subtitles/generate-subtitles'
import type { WordTimestamp } from '@/lib/ai/transcription/transcribe-with-timestamps'

export type { SubtitleCue, WordTimestamp }

const subtitlesSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export interface GenerateSubtitlesResult {
  ok: true
  cues: SubtitleCue[]
  srt: string
  vtt: string
  wordCount: number
  estimated: boolean
}

export type GenerateSubtitlesState =
  | { ok?: undefined; error?: string }
  | GenerateSubtitlesResult
  | { ok: false; error: string }

export async function generateSubtitlesAction(
  _prev: GenerateSubtitlesState,
  formData: FormData,
): Promise<GenerateSubtitlesState> {
  const parsed = subtitlesSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const { workspace_id: workspaceId, content_id: contentId } = parsed.data

  const memberCheck = await requireWorkspaceMember(workspaceId)
  if (!memberCheck.ok) return { ok: false, error: memberCheck.message }

  const rl = await checkWorkspaceRateLimit(workspaceId, 'mediaJob')
  if (!rl.ok) return { ok: false, error: rl.error }

  const item = await getContentItem(contentId, workspaceId)
  if (!item) {
    return { ok: false, error: 'Content item not found.' }
  }
  if (item.status !== 'ready') {
    return { ok: false, error: 'Content must be in "ready" state to generate subtitles.' }
  }

  let words: WordTimestamp[]
  let estimated = false

  if (item.kind === 'video' && item.source_url) {
    // Option A: uploaded video — download from Supabase Storage and re-transcribe
    // with word-level timestamps using OpenAI Whisper.
    const keyResult = await getDecryptedAiKey(workspaceId, 'openai')
    if (!keyResult.ok) {
      return {
        ok: false,
        error:
          keyResult.code === 'no_key'
            ? 'No OpenAI key saved for this workspace. Add one in Settings → AI Keys.'
            : keyResult.message,
      }
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()

    // Download the file from Supabase Storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('content')
      .download(item.source_url)

    if (downloadError || !fileBlob) {
      return {
        ok: false,
        error: 'Could not download the video file from storage. Please try again.',
      }
    }

    // Determine filename from source_url
    const filename = item.source_url.split('/').pop() ?? 'audio.webm'

    const transcribeResult = await transcribeWithTimestamps(
      { kind: 'blob', data: fileBlob },
      filename,
      keyResult.plaintext,
    )
    if (!transcribeResult.ok) {
      return { ok: false, error: transcribeResult.error }
    }

    words = transcribeResult.result.words

    // If Whisper returned no word timestamps, fall back to estimation
    if (words.length === 0 && item.transcript) {
      words = []
      estimated = true
    }
  } else {
    // Option B: no source file (YouTube, URL, text) — estimate from transcript text
    if (!item.transcript) {
      return {
        ok: false,
        error: 'No transcript found. The content must have a transcript to generate subtitles.',
      }
    }
    words = []
    estimated = true
  }

  let cues: SubtitleCue[]
  if (estimated) {
    if (!item.transcript) {
      return { ok: false, error: 'No transcript available for estimated subtitle generation.' }
    }
    cues = buildEstimatedCues(item.transcript)
  } else {
    cues = buildSubtitleCues(words)
  }

  if (cues.length === 0) {
    return { ok: false, error: 'Could not build any subtitle cues from the transcript.' }
  }

  const srt = generateSrt(cues)
  const vtt = generateVtt(cues)

  // Persist to metadata
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()

  const existingMetadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  const { error: updateError } = await supabase
    .from('content_items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({
      metadata: {
        ...existingMetadata,
        word_timestamps: estimated ? [] : words,
        subtitle_cues: cues,
        srt,
        vtt,
        subtitles_estimated: estimated,
        subtitles_generated_at: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    })
    .eq('id', contentId)
    .eq('workspace_id', workspaceId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  revalidatePath(`/workspace/${workspaceId}/content/${contentId}/subtitles`)

  return {
    ok: true,
    cues,
    srt,
    vtt,
    wordCount: estimated ? 0 : words.length,
    estimated,
  }
}
