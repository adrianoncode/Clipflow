import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { AiProvider } from '@/lib/ai/providers/types'
import { log } from '@/lib/log'

export interface AiKeySummary {
  id: string
  provider: AiProvider
  label: string | null
  masked_preview: string | null
  created_at: string
}

/**
 * Returns every AI key visible to the current user inside the given
 * workspace. RLS restricts to owners of the workspace (see M1 policy
 * "ai_keys: select if owner").
 *
 * Wrapped in React cache so the settings page + any sibling RSC can read
 * the same list in one request without duplicate queries.
 */
export const getAiKeys = cache(
  async (workspaceId: string): Promise<AiKeySummary[]> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('ai_keys')
      .select('id, provider, label, masked_preview, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      log.error('getAiKeys failed', error)
      return []
    }

    return (data ?? []) as AiKeySummary[]
  },
)
