/**
 * Prompt builder for Competitor Comment Mining (Feature 13).
 * Analyzes competitor video comments to find trending topics and content gaps.
 */
export function buildCompetitorCommentsPrompt(input: {
  channelName: string
  comments: Array<{ text: string; likeCount: number; videoTitle?: string }>
}): { system: string; user: string } {
  const commentText = input.comments
    .slice(0, 80)
    .map((c) => `${c.videoTitle ? `[${c.videoTitle}] ` : ''}[${c.likeCount} likes] ${c.text}`)
    .join('\n')

  return {
    system: `You are a competitive intelligence analyst specializing in social media content.

Analyze comments from a competitor's YouTube channel and extract actionable intelligence.

Respond with a JSON object:
{
  "topics": [
    {
      "topic": "<string — trending topic or recurring theme>",
      "frequency": <number — how many comments reference this>,
      "sentiment": "<string — positive, mixed, negative>",
      "painPoints": ["<string — specific pain point mentioned>", ...],
      "contentOpportunity": "<string — how to create better content on this topic>"
    }
  ],
  "contentGaps": ["<string — topics the competitor's audience wants but isn't getting>", ...],
  "audienceInsights": ["<string — what we know about this audience>", ...],
  "competitorWeaknesses": ["<string — where the competitor is failing their audience>", ...]
}

Rules:
- Focus on what the audience WANTS, not what the competitor is already doing well
- Identify content gaps — questions that aren't being answered
- Pain points = specific frustrations mentioned in comments
- contentOpportunity should be specific enough to act on
- Return 3-6 topics sorted by frequency`,

    user: `Analyze comments from competitor "${input.channelName}":\n\n${commentText}`,
  }
}
