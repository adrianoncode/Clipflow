import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface VoiceClone {
  id: string
  name: string
  elevenlabs_voice_id: string
  is_default: boolean
  sample_url: string | null
  created_at: string
}

/**
 * Gets the default voice clone for a workspace.
 */
export async function getDefaultVoice(workspaceId: string): Promise<VoiceClone | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('voice_clones')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_default', true)
      .limit(1)
      .single()

    if (error) return null
    return (data as VoiceClone | null) ?? null
  } catch {
    return null
  }
}

/**
 * Gets all voice clones for a workspace.
 */
export async function getVoiceClones(workspaceId: string): Promise<VoiceClone[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('voice_clones')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  return (data as VoiceClone[] | null) ?? []
}
