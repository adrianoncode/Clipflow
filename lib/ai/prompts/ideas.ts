export interface IdeasPromptInput {
  niche: string
  audience: string
  platform: string
}

export interface IdeasPromptOutput {
  system: string
  user: string
}

/**
 * Builds the prompt for the content ideas generator.
 * Returns 15 ideas as a JSON array of objects: { title, hook, why }
 */
export function buildIdeasPrompt(input: IdeasPromptInput): IdeasPromptOutput {
  const system = `You are an expert content strategist who creates viral content ideas for social media.
You deeply understand platform-specific formats, hooks, and what drives engagement.
Respond with a JSON object containing an "ideas" array. Each idea must have:
- "title": a concise content title (max 80 chars)
- "hook": the opening line that stops the scroll (max 120 chars)
- "why": one sentence explaining why this will perform well (max 120 chars)

Return exactly 15 ideas. Be specific, not generic. Tailor every idea to the niche, audience, and platform provided.`

  const user = `Generate 15 content ideas for:
- Niche: ${input.niche}
- Target audience: ${input.audience}
- Platform: ${input.platform}

Focus on what is currently trending and what drives the most engagement on ${input.platform}. Ideas should be immediately actionable — someone should be able to record or write the content today.`

  return { system, user }
}
