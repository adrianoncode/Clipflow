import 'server-only'

import { generate } from '@/lib/ai/generate/generate'
import type { AiProvider } from '@/lib/ai/providers/types'
import { getPromptBuilder } from '@/lib/ai/prompts/get-prompt'
import { getLanguageInstruction } from '@/lib/ai/prompts/languages'
import { getActiveBrandVoice, buildBrandVoiceInstruction } from '@/lib/brand-voice/get-active-brand-voice'
import { insertOutputWithDraftState } from '@/lib/outputs/insert-output'
import { renderOutputMarkdown } from '@/lib/outputs/render-markdown'
import type { ContentKind, OutputPlatform } from '@/lib/supabase/types'

export interface RunOnePlatformInput {
  platform: OutputPlatform
  transcript: string
  sourceKind: ContentKind
  sourceTitle: string
  provider: AiProvider
  apiKey: string
  model: string
  workspaceId: string
  contentId: string
  userId: string
  /** BCP-47 language code, e.g. 'en', 'de', 'es'. Defaults to 'en' (no translation). */
  targetLanguage?: string
}

export type RunOnePlatformResult =
  | { ok: true; platform: OutputPlatform }
  | { ok: false; platform: OutputPlatform; error: string }

/**
 * Runs the full generation pipeline for a single platform:
 * build prompt → call LLM → render markdown → insert output + draft state.
 *
 * Extracted from the generateOutputsAction closure so it can be reused
 * by the per-platform regenerateOutputAction in M5.
 */
export async function runOnePlatform(
  input: RunOnePlatformInput,
): Promise<RunOnePlatformResult> {
  const { platform, transcript, sourceKind, sourceTitle, provider, apiKey, model,
    workspaceId, contentId, userId } = input

  const build = getPromptBuilder(platform)
  const prompt = build({ transcript, sourceKind, sourceTitle })

  // Append language instruction to system prompt when a non-English language is requested.
  const langInstruction = getLanguageInstruction(input.targetLanguage ?? 'en')

  // Inject brand voice guidelines if the workspace has an active brand voice configured.
  const brandVoice = await getActiveBrandVoice(workspaceId)
  const brandVoiceInstruction = buildBrandVoiceInstruction(brandVoice)

  const system = prompt.system + (langInstruction ?? '') + brandVoiceInstruction

  const gen = await generate({ provider, apiKey, model, system, user: prompt.user })
  if (!gen.ok) {
    return { platform, ok: false, error: gen.message }
  }

  const markdown = renderOutputMarkdown(platform, gen.json)
  const insert = await insertOutputWithDraftState({
    workspaceId,
    contentId,
    platform,
    body: markdown,
    structured: gen.json,
    provider,
    model,
    userId,
  })

  if (!insert.ok) {
    return { platform, ok: false, error: insert.error }
  }
  return { platform, ok: true }
}
