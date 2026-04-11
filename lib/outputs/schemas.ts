import { z } from 'zod'

/**
 * Input schema for generateOutputsAction and retryGenerateOutputsAction.
 * Kept out of the 'use server' action module so it can be imported
 * freely — server action files may only export async functions.
 */
export const generateOutputsSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export type GenerateOutputsInput = z.infer<typeof generateOutputsSchema>
