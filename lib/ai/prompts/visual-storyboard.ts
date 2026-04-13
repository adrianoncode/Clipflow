/**
 * Script-to-Storyboard with AI Images — generates DALL-E prompts per scene.
 */
export function buildVisualStoryboardPrompt(input: {
  script: string
  style?: string
}): { system: string; user: string } {
  return {
    system: `You are a video storyboard artist who creates visual scene breakdowns.

Split the script into 4-8 scenes and generate a DALL-E image prompt for each scene.

Respond with a JSON object:
{
  "scenes": [
    {
      "sceneNumber": <number>,
      "duration": "<string — e.g. '3-5 seconds'>",
      "scriptSegment": "<string — the part of the script for this scene>",
      "visualDescription": "<string — what should be shown on screen>",
      "dallePrompt": "<string — detailed DALL-E prompt (50-80 words), include style, lighting, colors, composition>",
      "transitionIn": "<string — cut, fade, zoom, slide>",
      "textOverlay": "<string — any text to show on screen, or empty>"
    }
  ],
  "overallStyle": "<string — visual style guide for consistency: color palette, mood, aesthetic>",
  "musicSuggestion": "<string — type of background music that fits>"
}

Rules:
- Each scene should be 3-8 seconds
- DALL-E prompts must be specific: art style, camera angle, lighting, color palette
- Keep visual style consistent across all scenes
- First scene = the hook (most visually striking)
- Last scene = CTA (clean, branded feel)
${input.style ? `- Art style preference: ${input.style}` : '- Default to modern, clean, high-contrast digital illustration style'}
- NO faces or real people in DALL-E prompts (use abstract/stylized representations)`,

    user: `Create a visual storyboard for this script:\n\n${input.script.slice(0, 5000)}`,
  }
}
