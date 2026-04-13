/**
 * Smart Hashtag Research — data-driven hashtag analysis and recommendations.
 */
export function buildHashtagResearchPrompt(input: {
  topic: string
  platform: string
  existingHashtags?: string[]
}): { system: string; user: string } {
  return {
    system: `You are a social media hashtag strategist with deep knowledge of platform algorithms.

Analyze hashtags for the given topic and platform. Provide data-driven recommendations.

Respond with a JSON object:
{
  "recommended": [
    {
      "hashtag": "<string — without # prefix>",
      "category": "<string — primary, secondary, niche, trending>",
      "estimatedReach": "<string — e.g. '1M-5M', '100K-500K', '10K-50K'>",
      "competition": "<string — low, medium, high, very high>",
      "trending": <boolean>,
      "relevanceScore": <number 1-100>,
      "tip": "<string — when/why to use this specific hashtag>"
    }
  ],
  "strategy": {
    "totalCount": <number — recommended number of hashtags for this platform>,
    "mix": "<string — e.g. '3 broad + 4 niche + 3 trending'>",
    "avoid": ["<string — hashtags to avoid and why>"],
    "timing": "<string — when these hashtags perform best>"
  },
  "hashtagSets": [
    {
      "name": "<string — e.g. 'Maximum reach', 'Niche authority', 'Trending mix'>",
      "hashtags": ["<string>"],
      "bestFor": "<string — when to use this set>"
    }
  ]
}

Rules:
- TikTok: 3-5 hashtags max, mix of broad + niche
- Instagram: 20-30 hashtags, organized by reach tiers
- YouTube: 3-5 tags in title/description
- LinkedIn: 3-5 hashtags, professional focus
- Include a mix: some with millions of posts (discoverability), some with <100K (less competition)
- Flag any hashtags that are banned or shadowbanned
- Create 3 ready-to-use hashtag sets`,

    user: `Research hashtags for:\nTopic: ${input.topic}\nPlatform: ${input.platform}${input.existingHashtags?.length ? `\nCurrent hashtags: ${input.existingHashtags.join(', ')}` : ''}`,
  }
}
