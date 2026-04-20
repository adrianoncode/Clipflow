import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { BrandKit } from './types'

/**
 * Returns the workspace's saved brand kit, or null when none exists.
 * Never throws — RLS violations and missing rows both collapse to null
 * so callers can safely fall back to defaults.
 */
export async function getBrandKit(workspaceId: string): Promise<BrandKit | null> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('workspaces')
      .select('branding')
      .eq('id', workspaceId)
      .maybeSingle()
    if (!data?.branding || typeof data.branding !== 'object' || Array.isArray(data.branding)) {
      return null
    }
    return data.branding as BrandKit
  } catch {
    return null
  }
}
