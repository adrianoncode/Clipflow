/**
 * Pure, client-safe caption chunking. Previously lived inside
 * render-highlight-clip.ts which is server-only — that prevented the
 * preview editor from showing the same chunks the renderer will
 * actually burn into the MP4.
 *
 * Extracted so both sides of the pipeline can agree on chunk
 * boundaries. No `server-only` import, no Supabase calls, no network
 * dependencies. Deterministic given the same word-timings input.
 */

export interface WordTiming {
  word: string
  start: number
  end: number
}

export interface CaptionChunk {
  text: string
  startSeconds: number
  lengthSeconds: number
}

/**
 * Groups Whisper word-timings into 2-3 word caption "chunks" that flip
 * in sync with speech. TikTok/Reels-style karaoke captions show 1-3
 * words at a time — never a whole sentence — so the viewer's eye can
 * catch up at reading speed.
 *
 * Chunking rules:
 *  - up to 3 words per chunk
 *  - force a break on sentence-ending punctuation (. ? !)
 *  - force a break if the gap between words >= 0.6s (natural pause)
 *  - never emit a chunk longer than 2.0s
 *
 * Offsets are relative to the CLIP, not the source video — pass
 * clipStartSeconds as the zero point.
 */
export function chunkWordsForCaptions(
  words: WordTiming[],
  clipStartSeconds: number,
  clipEndSeconds: number,
): CaptionChunk[] {
  const inClip = words.filter(
    (w) => w.end > clipStartSeconds - 0.05 && w.start < clipEndSeconds + 0.05,
  )

  const chunks: CaptionChunk[] = []
  let buffer: WordTiming[] = []

  function flush() {
    if (buffer.length === 0) return
    const first = buffer[0]!
    const last = buffer[buffer.length - 1]!
    const start = Math.max(first.start - clipStartSeconds, 0)
    const end = Math.min(
      last.end - clipStartSeconds,
      clipEndSeconds - clipStartSeconds,
    )
    const length = Math.max(end - start, 0.3)
    const text = buffer
      .map((w) => w.word)
      .join(' ')
      .replace(/\s+([.,!?;:])/g, '$1')
      .trim()
    if (text) chunks.push({ text, startSeconds: start, lengthSeconds: length })
    buffer = []
  }

  for (let i = 0; i < inClip.length; i++) {
    const w = inClip[i]!
    const prev = buffer[buffer.length - 1]
    const bufferDuration = prev ? w.end - buffer[0]!.start : 0
    const gapFromPrev = prev ? w.start - prev.end : 0

    if (buffer.length >= 3 || bufferDuration > 2.0 || (prev && gapFromPrev >= 0.6)) {
      flush()
    }

    buffer.push(w)

    if (/[.?!]$/.test(w.word.trim())) {
      flush()
    }
  }
  flush()

  return chunks
}
