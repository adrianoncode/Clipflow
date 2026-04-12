import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface OutputTemplate {
  id: string
  name: string
  platform: string
  system_prompt: string
  structure_hint: string | null
  is_default: boolean
}

export async function getWorkspaceTemplates(workspaceId: string): Promise<OutputTemplate[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    const { data } = await supabase
      .from('output_templates')
      .select('id, name, platform, system_prompt, structure_hint, is_default')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
    return (data ?? []) as OutputTemplate[]
  } catch {
    return [] // table may not exist yet
  }
}
