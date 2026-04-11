import 'server-only'

import type { TranscribeInput, TranscribeResult } from '@/lib/ai/transcription/types'
import { transcribeWithWhisper } from '@/lib/ai/transcription/whisper'

/**
 * Provider dispatcher for transcription. M3 only supports OpenAI Whisper —
 * Anthropic has no transcription product and Google Speech-to-Text has a
 * different API surface. The other branches stay for M4+ to fill in
 * without touching callers.
 */
export async function transcribe(input: TranscribeInput): Promise<TranscribeResult> {
  switch (input.provider) {
    case 'openai':
      return transcribeWithWhisper({
        apiKey: input.apiKey,
        blob: input.blob,
        filename: input.filename,
        mimeType: input.mimeType,
      })
    case 'anthropic':
    case 'google':
      return {
        ok: false,
        code: 'unsupported_provider',
        message:
          'Transcription is only supported via OpenAI right now. Add an OpenAI key in Settings.',
      }
  }
}
