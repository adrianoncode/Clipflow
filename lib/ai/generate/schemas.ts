import { z } from 'zod'

/**
 * Zod schema that every provider adapter validates against after parsing
 * the model response. Shape mirrors `PromptOutput` in ./types.ts but
 * lives in its own file so it can be imported by both server-only
 * adapters and client components without dragging `server-only` around.
 *
 * LinkedIn leaves `script` empty (`z.string()` allows empty strings).
 */
export const promptOutputSchema = z.object({
  hook: z.string().min(1).max(400),
  script: z.string().max(4000),
  caption: z.string().min(1).max(3000),
  hashtags: z.array(z.string()).max(15),
})

export type PromptOutputValidated = z.infer<typeof promptOutputSchema>

/**
 * Anthropic tool_use and Google responseSchema both want a JSON-Schema
 * representation of the same shape. Generated once here so the adapter
 * files stay focused on the fetch + error mapping.
 */
export const PROMPT_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    hook: { type: 'string', description: 'Attention-grabbing opener.' },
    script: {
      type: 'string',
      description: 'Full script or body text. Empty string for LinkedIn.',
    },
    caption: { type: 'string', description: 'Platform caption / post body.' },
    hashtags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Hashtags without the # prefix.',
    },
  },
  required: ['hook', 'script', 'caption', 'hashtags'],
} as const

/**
 * Google's responseSchema syntax uses UPPERCASE type names instead of
 * the JSON Schema lowercase. Easy to miss — keep them in their own
 * constant to make the difference obvious at the call site.
 */
export const PROMPT_OUTPUT_GEMINI_SCHEMA = {
  type: 'OBJECT',
  properties: {
    hook: { type: 'STRING' },
    script: { type: 'STRING' },
    caption: { type: 'STRING' },
    hashtags: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
  },
  required: ['hook', 'script', 'caption', 'hashtags'],
} as const
