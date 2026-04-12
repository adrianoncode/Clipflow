import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface AiPersona {
  id: string
  name: string
  backstory: string
  expertise_areas: string[]
  writing_quirks: string
  example_responses: string
  is_active: boolean
}

/**
 * Fetches the active AI persona for a workspace.
 * Returns null if no active persona is set.
 */
export const getActivePersona = cache(async (workspaceId: string): Promise<AiPersona | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ai_personas')
    .select('id, name, backstory, expertise_areas, writing_quirks, example_responses, is_active')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .limit(1)
    .single()

  return data ?? null
})

/**
 * Fetches all personas for a workspace.
 */
export async function getPersonas(workspaceId: string): Promise<AiPersona[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ai_personas')
    .select('id, name, backstory, expertise_areas, writing_quirks, example_responses, is_active')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  return (data ?? []) as AiPersona[]
}

/**
 * Builds a system prompt injection from an active persona.
 * Appended to the generation system prompt after brand voice.
 */
export function buildPersonaInstruction(persona: AiPersona | null): string {
  if (!persona) return ''

  const parts: string[] = [
    `\n\n## AI Persona: ${persona.name}`,
  ]

  if (persona.backstory) {
    parts.push(`Background: ${persona.backstory}`)
  }
  if (persona.expertise_areas.length > 0) {
    parts.push(`Areas of expertise: ${persona.expertise_areas.join(', ')}`)
  }
  if (persona.writing_quirks) {
    parts.push(`Writing style & quirks: ${persona.writing_quirks}`)
  }
  if (persona.example_responses) {
    parts.push(`Example of how this persona writes:\n${persona.example_responses}`)
  }
  parts.push('Write ALL content as this persona — adopt their voice, knowledge, and style completely.')

  return '\n' + parts.join('\n')
}
