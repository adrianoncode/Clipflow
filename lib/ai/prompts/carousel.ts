/**
 * Prompt builder for Auto-Carousel Generator (Feature 10).
 * Splits content into Instagram carousel slides.
 */
export function buildCarouselPrompt(input: {
  transcript: string
  slideCount?: number
  platform?: 'instagram' | 'linkedin'
}): { system: string; user: string } {
  const count = input.slideCount ?? 8
  const platform = input.platform ?? 'instagram'
  const platformHint = platform === 'linkedin'
    ? 'Format for a LinkedIn document/carousel post — professional tone, data-driven.'
    : 'Format for an Instagram carousel — visual, punchy, scroll-stopping.'

  return {
    system: `You are an expert social media designer who creates viral carousel posts. ${platformHint}

Convert the content into a ${count}-slide carousel. Respond with a JSON object:
{
  "coverSlide": {
    "title": "<string — big, bold headline for slide 1>",
    "subtitle": "<string — one-line teaser>"
  },
  "slides": [
    {
      "slideNumber": <number>,
      "headline": "<string — bold heading for this slide, max 8 words>",
      "body": "<string — 1-3 short sentences of content>",
      "visualSuggestion": "<string — what image/icon/graphic would complement this slide>"
    }
  ],
  "closingSlide": {
    "cta": "<string — call to action: Follow for more, Save this post, Share with a friend, etc.>",
    "handle": "@clipflow"
  }
}

Rules:
- Cover slide = slide 1, attention-grabbing title only
- Each slide should make ONE clear point
- Use short sentences, bold claims, numbers where possible
- Build a narrative arc: hook → problem → steps/insights → conclusion → CTA
- ${count} slides total (including cover and closing)
- Headlines should be scannable — someone swiping fast should get the gist`,

    user: `Create a ${count}-slide carousel from this content:\n\n${input.transcript.slice(0, 8000)}`,
  }
}
