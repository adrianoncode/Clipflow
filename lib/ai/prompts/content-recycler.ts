/**
 * Content Recycling Engine — remixes old content with fresh hooks and current trends.
 */
export function buildContentRecyclerPrompt(input: {
  originalContent: { title: string; transcript: string; createdAt: string }
  currentTrends?: string[]
  platform?: string
}): { system: string; user: string } {
  const trendsHint = input.currentTrends?.length
    ? `\n\nCurrent trending topics to weave in:\n${input.currentTrends.map((t) => `- ${t}`).join('\n')}`
    : ''

  return {
    system: `You are a content recycling expert who breathes new life into old content.

Take the original content and create 3 "remix" versions — same core message but with fresh angles, updated hooks, and current trends woven in.

Respond with a JSON object:
{
  "analysis": {
    "coreMessage": "<string — the timeless message in this content>",
    "stillRelevant": <boolean>,
    "improvementAreas": ["<string — what's dated or could be better>"]
  },
  "remixes": [
    {
      "angle": "<string — what's different about this remix, e.g. 'Contrarian take', 'Updated with 2024 data', 'Story-driven version'>",
      "newHook": "<string — fresh scroll-stopping hook>",
      "script": "<string — complete remixed script, 150-300 words>",
      "whyBetter": "<string — why this remix will perform better than the original>",
      "bestPlatform": "<string — tiktok, reels, shorts, linkedin>"
    }
  ],
  "bestTimeToRepost": "<string — recommendation on when to republish recycled content>"
}

Rules:
- Keep the core value/lesson but change the packaging
- Each remix should feel completely new to someone who saw the original
- Update any outdated references, stats, or examples
- If trends are provided, naturally weave them into at least one remix
- One remix should be a "hot take" version (controversial angle on the same topic)
- One remix should be a "story" version (personal narrative framing)
- One remix should be an "updated" version (new data, new examples)`,

    user: `Original content (created ${input.originalContent.createdAt}):\nTitle: "${input.originalContent.title}"\n\n${input.originalContent.transcript.slice(0, 6000)}${trendsHint}`,
  }
}
