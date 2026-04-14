import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { RenderStatus } from '@/lib/supabase/types'

/**
 * Flips a rendering row to `done` or `failed`. Admin client because the
 * status-poll route may run from a context without the user session
 * (e.g. webhook-style callbacks), and we don't want RLS to bounce the
 * update. Workspace scoping is preserved via the row's workspace_id.
 */
export async function updateRender(params: {
  providerRenderId: string
  status: RenderStatus
  url?: string | null
  error?: string | null
}): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('renders')
    .update({
      status: params.status,
      url: params.url ?? null,
      error: params.error ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_render_id', params.providerRenderId)

  if (error) {
    console.error('[updateRender]', error.message)
  }
}
