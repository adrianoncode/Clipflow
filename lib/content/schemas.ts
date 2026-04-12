import { z } from 'zod'

/**
 * 25 MB is the hard limit on the Whisper API per single request. The
 * Supabase bucket has a 50 MiB ceiling configured in config.toml, so this
 * is the binding limit for transcription.
 */
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024

export const ACCEPTED_VIDEO_EXTENSIONS = [
  'mp4',
  'mov',
  'm4a',
  'mp3',
  'webm',
  'wav',
  'mpga',
  'ogg',
] as const
export type AcceptedVideoExtension = (typeof ACCEPTED_VIDEO_EXTENSIONS)[number]

/**
 * MIME type fallback — browsers sometimes report an empty `File.type`
 * (notably on older macOS for .m4a). We resolve the MIME from the
 * extension instead.
 */
export const extensionToMime: Record<AcceptedVideoExtension, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  webm: 'video/webm',
  wav: 'audio/wav',
  mpga: 'audio/mpeg',
  ogg: 'audio/ogg',
}

const extensionSchema = z.enum(ACCEPTED_VIDEO_EXTENSIONS)

export const createVideoSchema = z.object({
  workspace_id: z.string().uuid(),
  filename: z.string().trim().min(1).max(240),
  ext: extensionSchema,
  file_size: z
    .number({ coerce: true })
    .int()
    .positive()
    .max(MAX_VIDEO_BYTES, 'File exceeds the 25MB Whisper limit.'),
  mime_type: z.string().trim().max(120).default(''),
})

export const startTranscriptionSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  ext: extensionSchema,
})

export const retryTranscriptionSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export const createTextSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  body: z.string().trim().min(10, 'Please enter at least 10 characters.').max(50_000),
})

export const createYoutubeSchema = z.object({
  workspace_id: z.string().uuid(),
  url: z.string().trim().min(1, 'Enter a YouTube URL.').max(500),
})

export const createUrlSchema = z.object({
  workspace_id: z.string().uuid(),
  url: z.string().trim().url('Enter a valid URL (including https://).').max(500),
})

export const createRssSchema = z.object({
  workspace_id: z.string().uuid(),
  url: z.string().trim().url('Enter a valid RSS feed URL (including https://).').max(500),
})
