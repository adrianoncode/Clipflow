import 'server-only'

export interface WordTimestamp {
  word: string
  start: number // seconds
  end: number   // seconds
}

export interface TranscriptWithTimestamps {
  text: string
  words: WordTimestamp[]
  language: string | null
  duration: number | null
}

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions'

/**
 * Posts an audio/video blob to OpenAI Whisper with word-level timestamp
 * granularity (verbose_json response format). Returns the transcript text
 * and per-word start/end times in seconds.
 *
 * Implementation mirrors the existing whisper.ts conventions:
 * - Do NOT set Content-Type manually (undici sets the multipart boundary).
 * - Pass the Blob directly, do not call .arrayBuffer().
 * - 280s abort leaves headroom under Vercel Pro 300s maxDuration.
 */
export async function transcribeWithTimestamps(
  // Accept Buffer (Node.js) or Blob (Web API). Callers from Supabase Storage
  // provide a Blob; callers passing a raw Buffer need the Buffer path.
  audioInput: { kind: 'buffer'; data: Buffer } | { kind: 'blob'; data: Blob },
  filename: string,
  apiKey: string,
): Promise<{ ok: true; result: TranscriptWithTimestamps } | { ok: false; error: string }> {
  try {
    const formData = new FormData()
    let file: Blob
    if (audioInput.kind === 'buffer') {
      // Copy into a plain ArrayBuffer to avoid SharedArrayBuffer type issues
      const buf = audioInput.data
      const ab = new ArrayBuffer(buf.byteLength)
      const view = new Uint8Array(ab)
      view.set(buf)
      file = new Blob([ab], { type: 'audio/webm' })
    } else {
      file = audioInput.data
    }
    formData.append('file', file, filename)
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'word')
    formData.append('temperature', '0')

    let response: Response
    try {
      response = await fetch(WHISPER_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
        signal: AbortSignal.timeout(280_000),
      })
    } catch (err) {
      const name = (err as { name?: string })?.name
      if (name === 'AbortError' || name === 'TimeoutError') {
        return { ok: false, error: 'Timed out contacting OpenAI. Please try again.' }
      }
      return { ok: false, error: 'Could not reach OpenAI. Check your connection and retry.' }
    }

    if (!response.ok) {
      // Drain the body to free the connection but never reflect it back —
      // OpenAI's 401 occasionally echoes the supplied Authorization header,
      // so any error text we returned would be a plaintext-key leak vector.
      // Match the status → user-facing-message mapping used by `whisper.ts`.
      await response.text().catch(() => undefined)
      switch (response.status) {
        case 401:
          return {
            ok: false,
            error:
              'OpenAI rejected the key saved for this workspace. Update it in Settings → AI Keys.',
          }
        case 413:
          return { ok: false, error: 'This file exceeds the 25MB Whisper limit.' }
        case 415:
          return {
            ok: false,
            error:
              "Whisper doesn't support this file format. Try MP3, MP4, M4A, MOV, WAV, WEBM, or OGG.",
          }
        case 429:
          return {
            ok: false,
            error: 'OpenAI rate-limited the transcription. Try again in a moment.',
          }
        default:
          return {
            ok: false,
            error: `OpenAI returned an unexpected error (${response.status}).`,
          }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await response.json()) as any

    return {
      ok: true,
      result: {
        text: typeof data.text === 'string' ? data.text : '',
        words: Array.isArray(data.words)
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data.words as any[]).map((w) => ({
              word: typeof w.word === 'string' ? w.word : '',
              start: typeof w.start === 'number' ? w.start : 0,
              end: typeof w.end === 'number' ? w.end : 0,
            }))
          : [],
        language: typeof data.language === 'string' ? data.language : null,
        duration: typeof data.duration === 'number' ? data.duration : null,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error during transcription.',
    }
  }
}
