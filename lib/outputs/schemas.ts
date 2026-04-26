import { z } from 'zod'

/**
 * Input schema for generateOutputsAction and retryGenerateOutputsAction.
 * Kept out of the 'use server' action module so it can be imported
 * freely — server action files may only export async functions.
 */
// Per-platform template override:
//   undefined / missing → fall back to the workspace's auto-pick (legacy)
//   'default'           → user explicitly chose the built-in template, skip custom injection
//   <uuid>              → use this specific custom template
const templateOverride = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v === '' ? undefined : v ?? undefined))

export const generateOutputsSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  target_language: z.string().length(2).optional().default('en'),
  template_tiktok: templateOverride,
  template_instagram_reels: templateOverride,
  template_youtube_shorts: templateOverride,
  template_linkedin: templateOverride,
})

export type GenerateOutputsInput = z.infer<typeof generateOutputsSchema>

// ---------------------------------------------------------------------------
// M5 schemas
// ---------------------------------------------------------------------------

const platformEnum = z.enum(['tiktok', 'instagram_reels', 'youtube_shorts', 'linkedin'])

/**
 * Hashtags arrive as a comma-separated string from the form input and are
 * split + trimmed here. Leading '#' chars are stripped — renderOutputMarkdown
 * adds them back consistently.
 */
const hashtagsField = z.preprocess(
  (val) =>
    typeof val === 'string'
      ? val
          .split(',')
          .map((s) => s.trim().replace(/^#/, ''))
          .filter(Boolean)
      : val,
  z.array(z.string().max(100)).max(30),
)

export const updateOutputSchema = z.object({
  output_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  platform: platformEnum,
  // hook and script are optional — LinkedIn omits them.
  hook: z.string().max(2000).optional(),
  script: z.string().max(10_000).optional(),
  caption: z.string().min(1).max(5000),
  hashtags: hashtagsField,
})

export const transitionStateSchema = z.object({
  output_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  new_state: z.enum(['draft', 'review', 'approved', 'exported']),
})

export const regenerateOutputSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  output_id: z.string().uuid(),
  platform: platformEnum,
})
