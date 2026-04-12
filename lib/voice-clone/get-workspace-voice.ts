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
  const supabase = await createClient()
  const { data } = await supabase
    .from('voice_clones')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_default', true)
    .limit(1)
    .single()

  return (data as VoiceClone | null) ?? null
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
