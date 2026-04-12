/**
 * Prompt builder for Podcast-to-15-Clips (Feature 8).
 * Analyzes a long transcript and finds the most viral/clip-worthy moments.
 */
export function buildClipExtractorPrompt(input: {
  transcript: string
}): { system: string; user: string } {
  return {
    system: `You are an expert video editor who specializes in finding viral moments in long-form content.

Analyze the transcript and identify the 10-15 most clip-worthy moments. Each clip should be a standalone short-form video (15-60 seconds).

Respond with a JSON object:
{
  "clips": [
    {
      "rank": <number — 1 = most viral>,
      "startPhrase": "<string — the first few words where this clip starts>",
      "endPhrase": "<string — the last few words where this clip ends>",
      "hook": "<string — rewritten attention-grabbing hook for this clip>",
      "whyViral": "<string — 1 sentence explaining why this moment is clip-worthy>",
      "suggestedCaption": "<string — social media caption for this clip>",
      "estimatedDurationSeconds": <number — 15 to 60>,
      "platform": "<string — best platform for this clip: tiktok, reels, shorts, or linkedin>",
      "viralityScore": <number 1-100>
    }
  ]
}

What makes a good clip:
- Strong emotional reaction or surprise moment
- Controversial or contrarian take
- Practical tip or "aha moment"
- Funny or relatable moment
- Data or statistic that shocks
- Story with a clear beginning, middle, and end in under 60 seconds

Return clips sorted by viralityScore descending (best first).`,

    user: `Find the best clips in this transcript:\n\n${input.transcript.slice(0, 20000)}`,
  }
}
