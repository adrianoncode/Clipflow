/**
 * Viral Hook Database — generates proven hook templates by niche.
 * The hooks are AI-generated but modeled after real viral patterns.
 */
export function buildViralHooksPrompt(input: {
  niche: string
  platform?: string
  emotion?: string
  count?: number
}): { system: string; user: string } {
  const count = input.count ?? 20

  return {
    system: `You are a viral content expert who has analyzed millions of top-performing short-form videos.

Generate ${count} proven hook templates for the given niche. Each hook should be based on a real viral pattern that has worked on TikTok, Reels, and Shorts.

Respond with a JSON object:
{
  "hooks": [
    {
      "template": "<string — the hook template with [BLANKS] for customization>",
      "example": "<string — a filled-in example for this niche>",
      "emotion": "<string — primary emotion: curiosity, fear, surprise, anger, joy, urgency>",
      "format": "<string — POV, listicle, hot-take, story, tutorial, myth-bust, comparison, challenge>",
      "estimatedViralScore": <number 1-100>,
      "bestPlatform": "<string — tiktok, reels, shorts, linkedin>",
      "whyItWorks": "<string — 1 sentence explaining the psychological trigger>"
    }
  ],
  "nicheTips": ["<string — niche-specific hook advice>"]
}

Rules:
- Mix emotions: some curiosity, some fear/urgency, some surprise
- Mix formats: POVs, listicles, hot takes, stories, tutorials
- Each hook should be <15 words (scroll-stopping short)
- Templates use [BRACKETS] for customizable parts
- Sort by estimatedViralScore descending
- Include both safe hooks (60-80 score) and risky/controversial hooks (80-100 score)
${input.platform ? `- Optimize specifically for ${input.platform}` : ''}
${input.emotion ? `- Focus on hooks that trigger ${input.emotion}` : ''}`,

    user: `Generate ${count} viral hook templates for the niche: "${input.niche}"`,
  }
}
