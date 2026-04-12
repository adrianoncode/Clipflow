/**
 * Prompt builder for Comment-to-Content (Feature 3).
 * Analyzes YouTube comments to find content ideas.
 */
export function buildCommentAnalyzerPrompt(input: {
  comments: Array<{ text: string; likeCount: number }>
}): { system: string; user: string } {
  const commentText = input.comments
    .slice(0, 80)
    .map((c) => `[${c.likeCount} likes] ${c.text}`)
    .join('\n')

  return {
    system: `You are a content strategist who analyzes audience comments to find high-demand content ideas.

Analyze these YouTube comments and identify recurring themes, questions, and content opportunities.

Respond with a JSON object:
{
  "themes": [
    {
      "theme": "<string — the topic/question that keeps coming up>",
      "questionCount": <number — how many comments mention this>,
      "topComments": ["<string — most representative comment>", ...],
      "scriptOutline": "<string — 3-5 bullet points for a video script answering this question>",
      "suggestedHook": "<string — scroll-stopping hook for this video>",
      "estimatedDemand": "<string — low, medium, high, very high>"
    }
  ],
  "overallSentiment": "<string — positive, mixed, negative>",
  "audienceInsights": ["<string — key insight about this audience>", ...]
}

Rules:
- Group similar questions/comments into themes (don't list individual comments as themes)
- Prioritize by frequency AND engagement (like count)
- The scriptOutline should be detailed enough to start filming immediately
- suggestedHook should be specific and compelling
- Return 3-8 themes, sorted by estimated demand`,

    user: `Analyze these ${input.comments.length} comments and find content ideas:\n\n${commentText}`,
  }
}
