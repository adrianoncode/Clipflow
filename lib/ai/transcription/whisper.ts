import 'server-only'

import type { TranscribeInput, TranscribeResult } from '@/lib/ai/transcription/types'

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions'
const WHISPER_MODEL = 'whisper-1'

/**
 * Posts an audio/video blob to OpenAI's Whisper transcription endpoint and
 * returns the plaintext transcript.
 *
 * Implementation notes:
 * - `FormData` goes straight into `fetch(url, { body })`. Do NOT wrap in a
 *   `Request` constructor — undici has a known boundary-dropping bug there.
 * - Do NOT set Content-Type manually; undici sets the multipart boundary
 *   from the FormData automatically.
 * - Do NOT call `.arrayBuffer()` on the input Blob; pass the Blob directly
 *   so undici can stream it.
 * - 280s abort leaves ~20s headroom under the Vercel Pro 300s ceiling set
 *   via `maxDuration` on the enclosing Server Action module.
 * - Never logs the API key — only the HTTP status code on failures.
 */
export async function transcribeWithWhisper(
  input: Omit<TranscribeInput, 'provider'>,
): Promise<TranscribeResult> {
  const { apiKey, blob, filename } = input

  const formData = new FormData()
  formData.append('file', blob, filename)
  formData.append('model', WHISPER_MODEL)
  formData.append('response_format', 'json')
  formData.append('temperature', '0')

  let response: Response
  try {
    response = await fetch(WHISPER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(280_000),
    })
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'AbortError' || name === 'TimeoutError') {
      return {
        ok: false,
        code: 'network',
        message: 'Timed out contacting OpenAI. Please try again.',
      }
    }
    return {
      ok: false,
      code: 'network',
      message: 'Could not reach OpenAI. Check your connection and retry.',
    }
  }

  if (response.ok) {
    try {
      const json = (await response.json()) as { text?: unknown }
      if (typeof json.text !== 'string') {
        return {
          ok: false,
          code: 'provider_error',
          message: 'OpenAI returned an unexpected transcription payload.',
        }
      }
      return { ok: true, text: json.text }
    } catch {
      return {
        ok: false,
        code: 'provider_error',
        message: 'Could not parse the OpenAI transcription response.',
      }
    }
  }

  // Non-2xx — map status to user-facing error code.
  switch (response.status) {
    case 401:
      return {
        ok: false,
        code: 'invalid_key',
        message:
          'OpenAI rejected the key saved for this workspace. Update it in Settings → AI Keys.',
      }
    case 413:
      return {
        ok: false,
        code: 'file_too_large',
        message: 'This file exceeds the 25MB Whisper limit.',
      }
    case 415:
      return {
        ok: false,
        code: 'unsupported_format',
        message:
          "Whisper doesn't support this file format. Try MP3, MP4, M4A, MOV, WAV, WEBM, or OGG.",
      }
    case 429:
      return {
        ok: false,
        code: 'rate_limited',
        message: 'OpenAI rate-limited the transcription. Try again in a moment.',
      }
    default:
      // eslint-disable-next-line no-console
      console.error('[whisper] unexpected status', response.status)
      return {
        ok: false,
        code: 'provider_error',
        message: `OpenAI returned an unexpected error (${response.status}).`,
      }
  }
}
