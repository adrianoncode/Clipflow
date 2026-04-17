import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

/**
 * Returns true if the content item has at least one output row.
 * Used by the content detail page to flip the CTA between
 * "Generate outputs" and "View outputs".
 */
export const hasOutputs = cache(
  async (contentId: string, workspaceId: string): Promise<boolean> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('outputs')
      .select('id')
      .eq('content_id', contentId)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .limit(1)

    if (error) {
      log.error('hasOutputs failed', error, { workspaceId, contentId })
      return false
    }

    return (data ?? []).length > 0
  },
)
