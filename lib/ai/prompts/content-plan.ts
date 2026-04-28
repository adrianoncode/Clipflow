import type { BuiltPrompt } from '@/lib/ai/prompts/types'
import type { ApprovedDraftPreview, BrandContext, PlanSlot } from '@/lib/planner/build-plan'

const SYSTEM = `You are a content scheduling strategist for a creator's social-media workflow.

You receive:
- A list of "candidate slots" — date, time, platform, generic rationale (e.g. "Tuesday 9am — pre-work scroll").
- A list of "approved drafts" — short hooks + caption previews + tags + platform.
- A brand context — niche, tone, optional cadence overrides.

Your job: for EACH candidate slot, produce a refined plan entry by:
1. Picking the best-fit draft for that slot from the approved list (same platform, content energy that matches the time of day, hook style that fits the brand niche).
2. Re-writing the rationale into a single short sentence in ENGLISH that:
   - Says WHY this draft + slot combo works for the brand niche.
   - Stays under 110 characters.
   - Avoids generic platitudes ("great timing!"). Be specific.
3. NEVER inventing drafts that aren't in the input list — if no draft fits, set "draft_id" to null and the rationale becomes the time-slot rationale only.

Hard rules:
- Do not change the slot's date, time, or platform — those are fixed.
- "draft_id" must be one of the IDs from the approved drafts list, or null.
- "reason" is one sentence, plain text, no emoji, no markdown.

Respond with ONLY a JSON object matching this schema:
{
  "slots": [
    { "date": string, "time": string, "platform": string, "draft_id": string | null, "reason": string }
  ]
}
No prose outside the JSON, no markdown fences.`

interface ContentPlanInput {
  /** Cold-start candidate slots — already chronologically ordered. */
  candidates: PlanSlot[]
  drafts: ApprovedDraftPreview[]
  brand: BrandContext
}

export function buildContentPlanPrompt(input: ContentPlanInput): BuiltPrompt {
  const draftsBlock = input.drafts.map((d) => ({
    id: d.id,
    platform: d.platform,
    hook: d.hook,
    caption_preview: d.caption_preview.slice(0, 220),
    tags: d.tags.slice(0, 6),
  }))

  const candidatesBlock = input.candidates.map((c) => ({
    date: c.date,
    time: c.time,
    platform: c.platform,
    seed_rationale: c.reason,
    seed_draft_id: c.draftId,
  }))

  const user = JSON.stringify(
    {
      brand: {
        niche: input.brand.niche ?? 'general',
        tone: input.brand.tone ?? 'casual-confident',
        timezone: input.brand.timezone,
      },
      candidate_slots: candidatesBlock,
      approved_drafts: draftsBlock,
    },
    null,
    2,
  )

  return { system: SYSTEM, user }
}
