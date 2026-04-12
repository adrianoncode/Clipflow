export interface FollowUpTopicsPromptInput {
  transcript: string
  platform?: string
}

export interface FollowUpTopicsPromptOutput {
  system: string
  user: string
}

/**
 * Builds the prompt for follow-up topic suggestions.
 * Returns 5 topic ideas as a JSON array: { title, angle, why }
 */
export function buildFollowUpTopicsPrompt(
  input: FollowUpTopicsPromptInput,
): FollowUpTopicsPromptOutput {
  const system = `You are an expert content strategist who analyzes existing content and suggests high-performing follow-up topics.
You identify gaps, tangential angles, questions the audience will have after consuming the original content, and related topics with viral potential.
Respond with a JSON object containing a "topics" array. Each topic must have:
- "title": a concise content title (max 80 chars)
- "angle": the specific angle or hook that makes this worth creating (max 120 chars)
- "why": one sentence on why this naturally follows from the original content (max 120 chars)

Return exactly 5 topics. Be specific and actionable — someone should be able to create this content today.`

  const truncated = input.transcript.slice(0, 8000)
  const user = `Based on the following transcript, suggest 5 follow-up content topics that would perform well and naturally extend the conversation:

---
${truncated}
---

Focus on:
- Questions the audience will have after watching/reading this
- Deeper dives into specific points mentioned
- Contrarian or alternative perspectives
- Practical "how to" follow-ups to any concepts mentioned
- Related topics that share the same audience`

  return { system, user }
}
