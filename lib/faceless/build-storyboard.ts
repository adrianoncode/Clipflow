import 'server-only'

import { extractBrollKeywords } from '@/lib/broll/extract-broll-keywords'
import { searchPexelsVideos } from '@/lib/broll/search-pexels'
import { textToSpeech } from '@/lib/faceless/text-to-speech'
import { createClient } from '@/lib/supabase/server'

export interface StoryboardClip {
  keyword: string
  videoUrl: string
  thumbnail: string
  startSecond: number
  endSecond: number
}

export interface Storyboard {
  script: string
  audioUrl: string | null
  voiceId: string
  clips: StoryboardClip[]
  totalDurationSeconds: number
  subtitlesCues: Array<{ text: string; start: number; end: number }>
}

/**
 * Builds a faceless video storyboard:
 * 1. Generate voiceover via ElevenLabs TTS
 * 2. Upload audio to Supabase Storage
 * 3. Extract B-Roll keywords from script
 * 4. Find matching Pexels footage per keyword
 * 5. Estimate timing and assemble storyboard JSON
 */
export async function buildStoryboard(params: {
  script: string
  workspaceId: string
  contentId: string
  provider: string
  apiKey: string
  model: string
  voiceId?: string
}): Promise<{ ok: true; storyboard: Storyboard } | { ok: false; error: string }> {
  const { script, workspaceId, contentId } = params

  // Step 1: Generate voiceover
  const tts = await textToSpeech({
    text: script,
    workspaceId,
    voiceId: params.voiceId,
  })

  let audioUrl: string | null = null
  let voiceId = 'default'

  if (tts.ok) {
    voiceId = tts.voiceId
    // Upload to Supabase Storage
    const supabase = await createClient()
    const path = `faceless/${workspaceId}/${contentId}/voiceover.mp3`
    const { error } = await supabase.storage
      .from('content')
      .upload(path, tts.audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (!error) {
      const { data: urlData } = await supabase.storage
        .from('content')
        .createSignedUrl(path, 3600)
      audioUrl = urlData?.signedUrl ?? null
    }
  }

  // Step 2: Extract B-Roll keywords from script
  const keywords = await extractBrollKeywords(workspaceId, script)

  // Step 3: Find Pexels footage for each keyword
  const clips: StoryboardClip[] = []
  const wordsPerSecond = 2.5
  const totalDuration = Math.ceil(script.split(/\s+/).length / wordsPerSecond)
  const clipDuration = Math.ceil(totalDuration / Math.max(keywords.length, 1))

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i]
    if (!keyword) continue

    const result = await searchPexelsVideos(keyword, 1)
    const video = result[0]
    if (video) {
      clips.push({
        keyword,
        videoUrl: video.videoUrl,
        thumbnail: video.thumbnail,
        startSecond: i * clipDuration,
        endSecond: Math.min((i + 1) * clipDuration, totalDuration),
      })
    }
  }

  // Step 4: Build subtitle cues (simple word-by-word estimation)
  const words = script.split(/\s+/)
  const secondsPerWord = 1 / wordsPerSecond
  const subtitlesCues: Array<{ text: string; start: number; end: number }> = []

  for (let i = 0; i < words.length; i += 8) {
    const chunk = words.slice(i, i + 8).join(' ')
    subtitlesCues.push({
      text: chunk,
      start: i * secondsPerWord,
      end: Math.min((i + 8) * secondsPerWord, totalDuration),
    })
  }

  return {
    ok: true,
    storyboard: {
      script,
      audioUrl,
      voiceId,
      clips,
      totalDurationSeconds: totalDuration,
      subtitlesCues,
    },
  }
}
