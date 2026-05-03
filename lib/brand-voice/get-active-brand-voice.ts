import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'

export interface BrandVoice {
  id: string
  workspace_id: string
  name: string
  tone: string | null
  avoid: string | null
  example_hook: string | null
  is_active: boolean
}

/**
 * Returns the active brand voice for a workspace, or null if none exists.
 * Uses the unique partial index (workspace_id WHERE is_active = true).
 */
export async function getActiveBrandVoice(workspaceId: string): Promise<BrandVoice | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brand_voices')
    .select('id, workspace_id, name, tone, avoid, example_hook, is_active')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    log.error('getActiveBrandVoice failed', error, { workspaceId })
    return null
  }
  return data ?? null
}

/**
 * Admin-client variant for contexts without a user JWT (cron, webhooks,
 * autopilot resume). Same logic, bypasses RLS.
 */
export async function getActiveBrandVoiceAdmin(workspaceId: string): Promise<BrandVoice | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('brand_voices')
    .select('id, workspace_id, name, tone, avoid, example_hook, is_active')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    log.error('getActiveBrandVoiceAdmin failed', error, { workspaceId })
    return null
  }
  return (data as BrandVoice | null) ?? null
}

/**
 * Builds the brand voice injection string to append to system prompts.
 * Returns empty string if no active brand voice.
 */
export function buildBrandVoiceInstruction(voice: BrandVoice | null): string {
  if (!voice) return ''

  const parts: string[] = ['\n\n---\n**Brand Voice Guidelines**']

  if (voice.tone) {
    parts.push(`Tone: ${voice.tone}`)
  }
  if (voice.avoid) {
    parts.push(`Avoid: ${voice.avoid}`)
  }
  if (voice.example_hook) {
    parts.push(`Example hook style (match this energy):\n"${voice.example_hook}"`)
  }

  parts.push('Apply these brand voice guidelines to every piece of copy you write above.')

  return parts.join('\n')
}
