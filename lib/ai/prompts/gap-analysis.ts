export interface GapAnalysisPromptInput {
  contentTitles: string[]
  niche?: string
}

export interface GapAnalysisPromptOutput {
  system: string
  user: string
}

export function buildGapAnalysisPrompt(input: GapAnalysisPromptInput): GapAnalysisPromptOutput {
  const system = `You are a content strategist who specializes in identifying gaps in a creator's content library.
Given a list of existing content titles, identify topics the creator has NOT covered yet that their audience would find valuable.
Respond with a JSON object containing a "gaps" array. Each gap must have:
- "topic": a specific topic or title idea (max 80 chars)
- "reason": why this gap exists and why the audience wants it (max 120 chars)
- "urgency": "high" | "medium" | "low" based on audience demand

Return exactly 8 gaps. Be specific — avoid generic advice like "post more consistently".`

  const titleList = input.contentTitles.slice(0, 50).map((t, i) => `${i + 1}. ${t}`).join('\n')
  const nicheContext = input.niche ? `\n\nCreator niche: ${input.niche}` : ''

  const user = `Here are the creator's existing content titles:

${titleList}${nicheContext}

Based on these ${input.contentTitles.length} pieces of content, what important topics are missing? What would their audience search for next?`

  return { system, user }
}
