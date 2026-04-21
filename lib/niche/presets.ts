/**
 * Niche presets — industry-tuned tone guidance layered on top of the
 * platform template during generation. Selecting a niche in
 * /settings/templates persists the id on workspace.active_niche;
 * the generation pipeline loads it and injects `promptInstruction`
 * into the system message so every output reads correct for the
 * industry.
 *
 * Kept flat (plain object, no DB table) so adding a new preset is a
 * single code edit. If a workspace ever needs a truly custom niche,
 * they can build a full custom template via /settings/templates and
 * leave active_niche null.
 */

export type NicheId =
  | 'creator'
  | 'podcaster'
  | 'coach'
  | 'saas'
  | 'ecommerce'
  | 'agency'

export interface NichePreset {
  id: NicheId
  name: string
  description: string
  emoji: string
  /** Plain-English tone paragraph shown in the UI + sent to the LLM. */
  tone: string
  /** Compact system-prompt snippet — wraps `tone` in an instruction
   *  the model can actually act on. Kept short because it stacks
   *  with brand-voice + persona + custom template instructions. */
  promptInstruction: string
}

export const NICHE_PRESETS: Record<NicheId, NichePreset> = {
  creator: {
    id: 'creator',
    name: 'Creator / Influencer',
    description:
      'Personal voice, audience-first tone. Hooks that open loops and promise transformation.',
    emoji: '🎬',
    tone:
      'First-person, relatable, energetic. Use contractions and direct-address ("you"). Favor curiosity-gap openers over stat-drops.',
    promptInstruction:
      '\n\n--- Niche preset: Creator / Influencer ---\nWrite in first person. Use contractions and direct "you" address. Prefer curiosity-gap openers and transformational promises ("here is how I went from X to Y") over statistics. Keep tone relatable and energetic — not corporate, not academic.',
  },
  podcaster: {
    id: 'podcaster',
    name: 'Podcaster',
    description:
      'Conversation-snippet format. Quote the host, surface a single insight, point back to the full episode.',
    emoji: '🎙️',
    tone:
      'Quote-forward. Use em-dashes for attribution. End with a soft CTA to the full episode rather than a sales ask.',
    promptInstruction:
      '\n\n--- Niche preset: Podcaster ---\nTreat each clip like a conversation snippet. Quote the host using em-dashes for attribution ("... — Jane, on the pod"). Surface ONE insight per clip, not three. End with a soft CTA back to the full episode ("full conversation at the link") rather than a sales or follow ask.',
  },
  coach: {
    id: 'coach',
    name: 'Coach / Consultant',
    description:
      'Frameworks and contrarian takes. Each post positions the coach as the expert with a point of view.',
    emoji: '🎯',
    tone:
      'Assertive, framework-heavy. Prefer numbered lists and "the thing nobody tells you" angles. End with a concrete action, not a question.',
    promptInstruction:
      '\n\n--- Niche preset: Coach / Consultant ---\nWrite as an expert with a clear point of view. Lead with frameworks (named concepts, numbered lists) or contrarian takes ("the thing nobody tells you about X"). Avoid engagement questions at the end — coaches don\u2019t seek validation. End with a concrete action the reader should take today.',
  },
  saas: {
    id: 'saas',
    name: 'SaaS / B2B founder',
    description:
      'Story-driven, lesson-led. Draws from actual building experience, not generic advice.',
    emoji: '💼',
    tone:
      'Second-person LinkedIn voice on LinkedIn, first-person narrative on shorts. Favor specific numbers and company names. Avoid buzzwords like "synergy" or "leverage".',
    promptInstruction:
      '\n\n--- Niche preset: SaaS / B2B founder ---\nDraw from actual building experience — favor specific numbers, company names, and concrete moments over generic advice. On LinkedIn use second-person ("you") framing. On short-form platforms use first-person narrative. Ban: "synergy", "leverage" as a verb, "unlock", "game-changer", "actionable insights".',
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce / DTC',
    description:
      'Product-in-use, benefit-first, time-bound. Every post has a reason to act now.',
    emoji: '🛍️',
    tone:
      'Benefit-over-feature. Lead with a transformation, not the product name. Ship a soft discount or scarcity hook in the CTA when appropriate.',
    promptInstruction:
      '\n\n--- Niche preset: E-commerce / DTC ---\nLead with a transformation or benefit ("my skin stopped breaking out"), not the product name. Feature the product in use, not the product in isolation. Include a soft urgency hook in the CTA — a seasonal reason, a limited colorway, a today-only framing. Never lead with "introducing".',
  },
  agency: {
    id: 'agency',
    name: 'Agency / Studio',
    description:
      'Client-case narratives and positioning. Builds credibility through specific work shown.',
    emoji: '🏢',
    tone:
      'Third-person narrator voice. Quote the client result, not the tool. Use industry language (CAC, ROAS, CTR) where the audience expects it.',
    promptInstruction:
      '\n\n--- Niche preset: Agency / Studio ---\nWrite in a third-person narrator voice. Quote the client result ("they 3x\u2019d ROAS in six weeks") rather than the tools you used to get there. Use industry language (CAC, ROAS, CTR, LTV) when the audience is agency-side or brand-side marketers. Avoid "we helped" language — it reads as weak positioning.',
  },
}

export const ALL_NICHE_IDS: NicheId[] = Object.keys(NICHE_PRESETS) as NicheId[]

/**
 * Resolve a stored string into a typed NicheId. Returns null for
 * anything unknown so callers can treat it as "not set" without
 * needing to care whether the DB row was null or a stale id from an
 * older schema.
 */
export function parseNicheId(raw: string | null | undefined): NicheId | null {
  if (!raw) return null
  return ALL_NICHE_IDS.includes(raw as NicheId) ? (raw as NicheId) : null
}

/**
 * Returns the prompt instruction for a niche id, or an empty string
 * when no niche is set. Safe to concatenate directly into a system
 * prompt without a guard.
 */
export function getNicheInstruction(raw: string | null | undefined): string {
  const id = parseNicheId(raw)
  if (!id) return ''
  return NICHE_PRESETS[id].promptInstruction
}
