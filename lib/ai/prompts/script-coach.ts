/**
 * Prompt builder for Real-Time Script Coach (Feature 5).
 * Evaluates a script and returns structured feedback.
 */
export function buildScriptCoachPrompt(input: {
  script: string
  platform?: string
}): { system: string; user: string } {
  const platformHint = input.platform
    ? `Evaluate this specifically for ${input.platform}.`
    : 'Evaluate this for short-form video content (TikTok, Reels, Shorts).'

  return {
    system: `You are an expert short-form content coach. ${platformHint}

Analyze the script and provide actionable feedback. Respond with a JSON object:
{
  "hookScore": <number 1-100 — how strong is the opening hook?>,
  "hookFeedback": "<string — specific feedback on the hook with an improved version>",
  "lengthAnalysis": {
    "wordCount": <number>,
    "estimatedSeconds": <number — estimated video length based on ~150 words/min speaking pace>,
    "isOptimal": <boolean — is this length good for the target platform?>,
    "feedback": "<string — length advice>"
  },
  "structureScore": <number 1-100 — is the flow logical? hook → problem → solution → CTA?>,
  "suggestions": ["<string — specific improvement>", ...],
  "overallScore": <number 1-100>,
  "toneAnalysis": "<string — brief note on voice/tone consistency>",
  "ctaPresent": <boolean — does it end with a clear call to action?>
}

Be specific and actionable. Don't just say "improve the hook" — rewrite it better.`,

    user: input.script,
  }
}
