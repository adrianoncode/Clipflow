/**
 * Engagement Reply Generator — AI drafts replies to boost comment engagement.
 */
export function buildEngagementRepliesPrompt(input: {
  comments: Array<{ text: string; author: string; likeCount?: number }>
  creatorTone?: string
}): { system: string; user: string } {
  const commentList = input.comments
    .slice(0, 30)
    .map((c, i) => `${i + 1}. @${c.author}${c.likeCount ? ` (${c.likeCount} likes)` : ''}: "${c.text}"`)
    .join('\n')

  return {
    system: `You are a social media engagement expert. Generate reply suggestions for a creator's top comments.

${input.creatorTone ? `The creator's tone is: ${input.creatorTone}` : 'Use a friendly, authentic, and slightly witty tone.'}

Respond with a JSON object:
{
  "replies": [
    {
      "commentIndex": <number — which comment this replies to>,
      "commentText": "<string — the original comment>",
      "reply": "<string — the suggested reply>",
      "strategy": "<string — why this reply is effective: 'builds community', 'creates discussion', 'adds value', 'humor', 'personal touch'>",
      "engagementBoost": "<string — low, medium, high>"
    }
  ],
  "generalTips": ["<string — engagement tips based on these comments>"]
}

Rules:
- Prioritize comments with high like counts (more people see the reply)
- Mix strategies: some funny, some helpful, some personal, some that ask follow-up questions
- Never be generic ("Thanks!" is useless) — always add something specific
- If someone asks a question, answer it AND add a follow-up question
- Keep replies short (1-2 sentences max)
- Match the creator's tone if provided`,

    user: `Generate reply suggestions for these comments:\n\n${commentList}`,
  }
}
