import { buildInstagramReelsPrompt } from '@/lib/ai/prompts/instagram-reels'
import { buildLinkedInPrompt } from '@/lib/ai/prompts/linkedin'
import { buildTikTokPrompt } from '@/lib/ai/prompts/tiktok'
import type { PromptBuilder } from '@/lib/ai/prompts/types'
import { buildYouTubeShortsPrompt } from '@/lib/ai/prompts/youtube-shorts'
import type { OutputPlatform } from '@/lib/supabase/types'

/**
 * Returns the prompt builder for a given output platform. Single choke
 * point so M5's brand-voice injection can slot in without touching any
 * call site.
 */
export function getPromptBuilder(platform: OutputPlatform): PromptBuilder {
  switch (platform) {
    case 'tiktok':
      return buildTikTokPrompt
    case 'instagram_reels':
      return buildInstagramReelsPrompt
    case 'youtube_shorts':
      return buildYouTubeShortsPrompt
    case 'linkedin':
      return buildLinkedInPrompt
  }
}
