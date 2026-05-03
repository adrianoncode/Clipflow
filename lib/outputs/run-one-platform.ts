import 'server-only'

import { generate } from '@/lib/ai/generate/generate'
// LLM-only alias — output generation never uses media-stack providers.
import type { LlmProvider as AiProvider } from '@/lib/ai/providers/types'
import { getPromptBuilder } from '@/lib/ai/prompts/get-prompt'
import { getLanguageInstruction } from '@/lib/ai/prompts/languages'
import { getActiveBrandVoice, buildBrandVoiceInstruction } from '@/lib/brand-voice/get-active-brand-voice'
import { getActivePersona, buildPersonaInstruction } from '@/lib/personas/get-active-persona'
import { getActiveNiche } from '@/lib/niche/get-active-niche'
import { getNicheInstruction } from '@/lib/niche/presets'
import { getWorkspaceTemplates, type OutputTemplate } from '@/lib/templates/get-templates'
import { insertOutputWithDraftState } from '@/lib/outputs/insert-output'
import { renderOutputMarkdown } from '@/lib/outputs/render-markdown'
import type { ContentKind } from '@/lib/supabase/types'
import type { OutputPlatform } from '@/lib/platforms'

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
  /**
   * Per-generation template override.
   *   undefined → legacy auto-pick (find best match for platform)
   *   'default' → user explicitly picked built-in, skip custom injection
   *   <uuid>    → use this specific custom template
   */
  templateOverride?: string
  /**
   * Slice 17 — when a reviewer rejected a previous version with a
   * comment, the regen pipeline passes those notes here so the LLM
   * can address them in the new draft. Free-form bullet list.
   * Empty/undefined when this is a fresh generation.
   */
  revisionNotes?: string[]
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

  // Inject AI persona if one is active for this workspace.
  const persona = await getActivePersona(workspaceId)
  const personaInstruction = buildPersonaInstruction(persona)

  // Inject industry-niche preset (Creator / Podcaster / Coach / SaaS /
  // Ecommerce / Agency) if the workspace has one selected. Placed
  // between persona and custom template so a custom template can still
  // override niche tone when the user wants full control.
  const niche = await getActiveNiche(workspaceId)
  const nicheInstruction = getNicheInstruction(niche)

  // Inject custom output template — explicit override per generation
  // takes priority; otherwise fall back to the workspace's default
  // pick for this platform.
  const templateInstruction = await buildTemplateInstruction(
    workspaceId,
    platform,
    input.templateOverride,
  )

  // Slice 17 — append reviewer revision notes so the regen LLM can
  // actually act on the feedback ("Hook weak", "Off-brand", etc.). The
  // notes go LAST so they have the strongest recency bias on the model.
  const revisionInstruction = buildRevisionInstruction(input.revisionNotes)

  const system =
    prompt.system +
    (langInstruction ?? '') +
    brandVoiceInstruction +
    personaInstruction +
    nicheInstruction +
    templateInstruction +
    revisionInstruction

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
    // Tag the version source so the history reflects WHY this draft
    // exists — fresh AI gen vs. reviewer-rejected regen with notes.
    versionSource:
      input.revisionNotes && input.revisionNotes.length > 0
        ? 'reject_regen'
        : 'ai',
  })

  if (!insert.ok) {
    return { platform, ok: false, error: insert.error }
  }
  return { platform, ok: true }
}

// ---------------------------------------------------------------------------
// Slice 17 — reviewer revision notes
// ---------------------------------------------------------------------------

/**
 * Builds the trailing system-prompt block that tells the LLM about the
 * reviewer's last rejection. Returns empty string when no notes were
 * captured — fresh generations skip this block entirely.
 *
 * Notes are bullet-listed verbatim. The reason chip ("Hook weak") and
 * the optional free-text both already pre-pend a structured cue, so we
 * don't reinterpret them — the LLM gets exactly what the reviewer wrote.
 */
function buildRevisionInstruction(notes: string[] | undefined): string {
  if (!notes || notes.length === 0) return ''
  const bullets = notes.map((n) => `- ${n}`).join('\n')
  return `\n\nReviewer feedback on the previous version. Address each point in the new draft:\n${bullets}\n`
}

// ---------------------------------------------------------------------------
// Custom output template injection
// ---------------------------------------------------------------------------

/**
 * Loads workspace templates and returns an instruction string for the given
 * platform. Returns empty string when no matching template exists, so the
 * caller can safely concatenate without a guard.
 */
async function buildTemplateInstruction(
  workspaceId: string,
  platform: OutputPlatform,
  override?: string,
): Promise<string> {
  // User explicitly picked the built-in default for this platform —
  // don't inject any custom template prose.
  if (override === 'default') return ''

  let templates: OutputTemplate[]
  try {
    templates = await getWorkspaceTemplates(workspaceId)
  } catch {
    return '' // table may not exist yet
  }

  let match: OutputTemplate | undefined
  if (override) {
    // Honour explicit choice — but only if the template still exists
    // and matches the platform. (Defensive: a stale form value shouldn't
    // crash a generation; silently fall through to auto-pick.)
    match = templates.find((t) => t.id === override && t.platform === platform)
  }
  if (!match) {
    // Auto-pick: prefer is_default for this platform, else first match.
    match =
      templates.find((t) => t.platform === platform && t.is_default) ??
      templates.find((t) => t.platform === platform)
  }

  if (!match) return ''

  const parts: string[] = []

  if (match.system_prompt) {
    parts.push(
      `\n\n--- Custom template ("${match.name}") ---\n${match.system_prompt}`,
    )
  }

  if (match.structure_hint) {
    parts.push(
      `\n\nAdditional formatting guidance:\n${match.structure_hint}`,
    )
  }

  return parts.join('')
}
