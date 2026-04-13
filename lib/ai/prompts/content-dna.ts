/**
 * Content DNA Analyzer — analyzes a creator's best content to extract their winning formula.
 */
export function buildContentDnaPrompt(input: {
  contentSamples: Array<{ title: string; transcript: string; platform?: string }>
}): { system: string; user: string } {
  const samples = input.contentSamples
    .map((s, i) => `--- Sample ${i + 1}: "${s.title}" ${s.platform ? `(${s.platform})` : ''} ---\n${s.transcript.slice(0, 3000)}`)
    .join('\n\n')

  return {
    system: `You are a world-class content strategist who reverse-engineers viral content.

Analyze the creator's top-performing content samples and extract their unique "Content DNA" — the patterns, formulas, and style elements that make their content work.

Respond with a JSON object:
{
  "hookPatterns": [
    { "pattern": "<string — e.g. 'POV question format'>", "example": "<string — actual example from their content>", "frequency": "<string — how often they use this>" }
  ],
  "storytellingStructure": "<string — their typical narrative arc, e.g. 'Hook → Personal story → Lesson → CTA'>",
  "toneProfile": {
    "primary": "<string — main tone, e.g. 'conversational and slightly sarcastic'>",
    "keywords": ["<string — words/phrases they use often>"],
    "avoids": ["<string — things they never say/do>"]
  },
  "contentFormulas": [
    { "name": "<string — formula name, e.g. '3-Step Tutorial'>", "structure": "<string — step-by-step structure>", "bestFor": "<string — which platform this works best on>" }
  ],
  "topicClusters": ["<string — recurring themes/topics>"],
  "ctaStyle": "<string — how they typically end content>",
  "uniqueEdge": "<string — what makes this creator different from others in their niche>",
  "recommendations": ["<string — specific actionable tips to create more content like this>"],
  "idealPostingStrategy": {
    "frequency": "<string — recommended posting frequency>",
    "bestPlatforms": ["<string — ranked platforms for this style>"],
    "contentMix": "<string — recommended ratio of content types>"
  }
}

Be extremely specific — use actual quotes and examples from their content. Don't give generic advice.`,

    user: `Analyze these ${input.contentSamples.length} content samples and extract the creator's Content DNA:\n\n${samples}`,
  }
}
