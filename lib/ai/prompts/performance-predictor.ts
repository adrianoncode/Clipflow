/**
 * Prompt builder for the Clip Performance Predictor (Feature 6).
 * Takes a generated output's content and predicts views, best posting time, etc.
 */
export function buildPerformancePredictorPrompt(input: {
  platform: string
  hook: string
  script: string
  caption: string
  hashtags: string[]
}): { system: string; user: string } {
  return {
    system: `You are a social media analytics expert specializing in content performance prediction.

Analyze the given content for the platform "${input.platform}" and predict its performance.

Respond with a JSON object with these exact fields:
{
  "predictedViewsMin": <number — lower bound estimate>,
  "predictedViewsMax": <number — upper bound estimate>,
  "bestPostingDay": "<string — day of week like Monday, Tuesday, etc.>",
  "bestPostingHour": <number — hour in 24h format, e.g. 18 for 6 PM>,
  "confidenceScore": <number 1-100>,
  "hookStrength": <number 1-100>,
  "scrollStopPower": <number 1-100>,
  "shareability": <number 1-100>,
  "reasoning": "<string — 2-3 sentence explanation of why you predict this performance>"
}

Base predictions on:
- Hook strength (first 3 seconds / first line)
- Platform-specific best practices
- Caption quality and CTA strength
- Hashtag relevance and count
- Content type and current trends

Be realistic with view predictions. A typical creator (10k-50k followers) gets 5k-200k views on good content.`,

    user: `Platform: ${input.platform}
Hook: ${input.hook}
Script: ${input.script}
Caption: ${input.caption}
Hashtags: ${input.hashtags.join(', ')}

Predict the performance of this content.`,
  }
}
