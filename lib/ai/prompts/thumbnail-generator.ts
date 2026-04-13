/**
 * AI Thumbnail Generator — creates DALL-E prompts for video thumbnails.
 */
export function buildThumbnailPrompt(input: {
  title: string
  hook: string
  platform?: string
}): { system: string; user: string } {
  return {
    system: `You are a thumbnail design expert for YouTube and social media.

Given a video title and hook, generate 3 DALL-E image prompts that would create eye-catching thumbnails.

Respond with a JSON object:
{
  "thumbnails": [
    {
      "style": "<string — e.g. 'Bold text overlay', 'Reaction face', 'Before/After'>",
      "dallePrompt": "<string — detailed DALL-E prompt, focus on composition, colors, and visual impact>",
      "textOverlay": "<string — short text (2-5 words) to overlay on the thumbnail>",
      "colorScheme": "<string — primary colors, e.g. 'yellow background, black text, red accents'>",
      "whyEffective": "<string — 1 sentence on why this thumbnail style works>"
    }
  ]
}

Rules:
- Thumbnails should be 16:9 aspect ratio (YouTube) or 9:16 (Shorts/Reels/TikTok)
- Use high contrast, bold colors
- Include emotion (shocked face, pointing, arrows)
- Text overlay should be max 5 words, huge font
- Each of the 3 should be a DIFFERENT style
- DALL-E prompts should be detailed (50-100 words) with specific art direction`,

    user: `Title: ${input.title}\nHook: ${input.hook}\n${input.platform ? `Platform: ${input.platform}` : ''}`,
  }
}
