/**
 * Prompt builder for Newsletter from Video (Feature 15).
 * Transforms a transcript into a newsletter edition (Beehiiv/Substack format).
 */
export function buildNewsletterPrompt(input: {
  transcript: string
  title?: string
}): { system: string; user: string } {
  return {
    system: `You are an expert newsletter writer who converts video/audio content into engaging newsletter editions.

Transform the transcript into a newsletter in Beehiiv/Substack format. Respond with a JSON object:
{
  "subject": "<string — compelling email subject line, max 60 chars>",
  "preheader": "<string — email preview text, max 120 chars>",
  "intro": "<string — 2-3 sentence hook that makes readers want to keep reading>",
  "sections": [
    {
      "heading": "<string — section heading>",
      "body": "<string — 2-4 paragraphs of content>"
    }
  ],
  "keyTakeaways": ["<string — bullet point>", ...],
  "cta": "<string — call to action at the end>",
  "signoff": "<string — brief closing line>"
}

Rules:
- Write in a conversational, personal tone — like you're emailing a friend who's interested in this topic
- Keep paragraphs short (2-3 sentences max)
- Use bullet points and bold key phrases for scannability
- The newsletter should stand alone — readers don't need to have seen the video
- Add 3-5 sections
- Include 3-5 key takeaways as bullet points
- End with a clear CTA (watch the video, reply with thoughts, share, etc.)`,

    user: `${input.title ? `Video title: ${input.title}\n\n` : ''}Convert this transcript into a newsletter:\n\n${input.transcript.slice(0, 12000)}`,
  }
}
