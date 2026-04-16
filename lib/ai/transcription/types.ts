// Transcription only uses LLM providers (Whisper on OpenAI today).
// Local alias keeps existing call sites unchanged.
import type { LlmProvider as AiProvider } from '@/lib/ai/providers/types'

export type TranscriptionErrorCode =
  | 'invalid_key'
  | 'file_too_large'
  | 'unsupported_format'
  | 'rate_limited'
  | 'network'
  | 'provider_error'
  | 'unsupported_provider'

export interface TranscribeInput {
  provider: AiProvider
  apiKey: string
  blob: Blob
  filename: string
  mimeType: string
}

export type TranscribeResult =
  | { ok: true; text: string; durationSeconds?: number }
  | { ok: false; code: TranscriptionErrorCode; message: string }
