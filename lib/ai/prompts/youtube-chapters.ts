/**
 * Prompt builder for YouTube Chapter Generator (Feature 14).
 * Analyzes a transcript and generates YouTube chapter markers.
 */
export function buildYoutubeChaptersPrompt(input: {
  transcript: string
  durationSeconds?: number
}): { system: string; user: string } {
  const duration = input.durationSeconds
    ? `The video is approximately ${Math.round(input.durationSeconds / 60)} minutes long.`
    : ''

  return {
    system: `You are a YouTube content optimization expert.

Analyze the transcript and generate YouTube chapter markers (timestamps + titles).

Respond with a JSON object:
{
  "chapters": [
    { "timestamp": "00:00", "title": "Introduction" },
    { "timestamp": "02:15", "title": "Main Topic" },
    ...
  ]
}

Rules:
- The first chapter MUST start at "00:00"
- Generate 5-12 chapters depending on content length
- Each title should be concise (3-6 words), descriptive, and engaging
- Chapters should mark natural topic transitions
- Space chapters at least 30 seconds apart
- Use format "MM:SS" for timestamps under 1 hour, "H:MM:SS" for longer
- ${duration}
- If you can't determine exact timestamps, estimate based on position in the transcript`,

    user: `Generate YouTube chapters for this transcript:\n\n${input.transcript.slice(0, 15000)}`,
  }
}
