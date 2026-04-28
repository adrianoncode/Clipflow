import 'server-only'

import { z } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { generateRaw } from '@/lib/ai/generate/generate-raw'
import { buildContentPlanPrompt } from '@/lib/ai/prompts/content-plan'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { log } from '@/lib/log'
import { OUTPUT_PLATFORMS, type OutputPlatform } from '@/lib/platforms'
import {
  attachDraftsToSlots,
  pickCandidateSlots,
  type ApprovedDraftPreview,
  type BrandContext,
  type BuildPlanResult,
  type PlanSlot,
} from '@/lib/planner/build-plan'

/**
 * Top-level plan generator.
 *
 * Two-stage produce:
 *   1. Cold-start: pick candidate slots from per-platform best-time
 *      defaults, attach an approved draft per slot via round-robin.
 *   2. AI refinement: ask the workspace's preferred LLM to rewrite
 *      each slot's reason in a brand-tone-aware sentence and pick
 *      better draft fits where possible. If the LLM call fails or
 *      no AI key is connected, the cold-start plan stands as-is —
 *      every workspace gets a working planner regardless of plan tier.
 *
 * Side-effect-free aside from logging the LLM error path. The caller
 * (the action layer) decides whether to cache the result.
 */

interface GeneratePlanInput {
  workspaceId: string
  weekStarting: Date
  drafts: ApprovedDraftPreview[]
  brand: BrandContext
}

const PLATFORM_VALUES = OUTPUT_PLATFORMS.map((p) => p) as readonly OutputPlatform[]

const llmResponseSchema = z.object({
  slots: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        platform: z.string(),
        draft_id: z.string().nullable(),
        reason: z.string().min(1).max(140),
      }),
    )
    .max(35),
})

export async function generatePlan(
  input: GeneratePlanInput,
): Promise<
  | (BuildPlanResult & { aiUsed: boolean; aiError?: string })
  | { ok: false; error: string }
> {
  // Stage 1 — cold-start slots from defaults.
  const candidates = pickCandidateSlots(
    input.weekStarting,
    input.brand,
    input.drafts,
  )
  const initial = attachDraftsToSlots(candidates, input.drafts)

  if (initial.length === 0) {
    return {
      ok: false,
      error:
        'No approved drafts to plan. Approve a draft on the Board first, then come back.',
    }
  }

  // Stage 2 — ask the LLM to refine. If anything goes wrong, fall
  // through to the cold-start plan.
  const provider = await pickGenerationProvider(input.workspaceId)
  if (!provider.ok) {
    return {
      slots: initial,
      generatedAt: new Date().toISOString(),
      aiUsed: false,
      aiError: provider.message,
    }
  }

  const prompt = buildContentPlanPrompt({
    candidates: initial,
    drafts: input.drafts,
    brand: input.brand,
  })

  const result = await generateRaw({
    provider: provider.provider,
    apiKey: provider.apiKey,
    model: DEFAULT_MODELS[provider.provider],
    system: prompt.system,
    user: prompt.user,
  })

  if (!result.ok) {
    log.warn?.('content-plan: LLM call failed, falling back to defaults', {
      workspaceId: input.workspaceId,
      code: result.code,
    })
    return {
      slots: initial,
      generatedAt: new Date().toISOString(),
      aiUsed: false,
      aiError: result.message,
    }
  }

  const parsed = llmResponseSchema.safeParse(result.json)
  if (!parsed.success) {
    return {
      slots: initial,
      generatedAt: new Date().toISOString(),
      aiUsed: false,
      aiError: 'AI returned an unexpected shape — using defaults instead.',
    }
  }

  // Merge LLM response back over the cold-start slots: preserve
  // chronological order from `initial`, override draft_id + reason
  // when the LLM returned a sane match. Drop any LLM slot whose
  // platform isn't in our enum (defensive — shouldn't happen).
  const initialBySlotKey = new Map<string, PlanSlot>(
    initial.map((s) => [`${s.date}|${s.time}|${s.platform}`, s]),
  )
  const validDraftIds = new Set(input.drafts.map((d) => d.id))
  const draftsById = new Map(input.drafts.map((d) => [d.id, d] as const))
  const refined: PlanSlot[] = []

  for (const aiSlot of parsed.data.slots) {
    const key = `${aiSlot.date}|${aiSlot.time}|${aiSlot.platform}`
    const seed = initialBySlotKey.get(key)
    if (!seed) continue
    if (!PLATFORM_VALUES.includes(aiSlot.platform as OutputPlatform)) continue
    const platform = aiSlot.platform as OutputPlatform

    const draftId =
      aiSlot.draft_id && validDraftIds.has(aiSlot.draft_id)
        ? aiSlot.draft_id
        : seed.draftId
    const draft = draftId ? draftsById.get(draftId) : null

    refined.push({
      date: aiSlot.date,
      time: aiSlot.time,
      platform,
      draftId: draftId ?? null,
      draftTitle: draft?.hook ?? seed.draftTitle,
      reason: aiSlot.reason.trim(),
      // Even with AI tuning the slot, the time itself still came
      // from the cold-start defaults — flag it as such for the UI.
      fromDefaults: true,
    })
    initialBySlotKey.delete(key)
  }

  // Append any cold-start slots the LLM dropped (rare — happens if
  // the model emitted fewer entries than candidates). Keeps the user
  // from losing slots silently.
  for (const remaining of initialBySlotKey.values()) {
    refined.push(remaining)
  }

  // Re-sort chronologically — LLM may have shuffled.
  refined.sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
  )

  return {
    slots: refined,
    generatedAt: new Date().toISOString(),
    aiUsed: true,
  }
}
