import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'

/**
 * Webhook-side updater for `content_highlights`. Called from the
 * Shotstack callback handler alongside `updateRender()` so we flip
 * both the legacy `renders` row (generic video pipeline) and the
 * specific highlight row whenever a terminal render event arrives.
 *
 * Safe to call with a render_id that doesn't belong to a highlight —
 * the update just matches zero rows and no-ops.
 *
 * Admin client because webhook runs without a user session; workspace
 * scoping is preserved by the render_id match (Shotstack IDs are
 * unique per account).
 */
export async function updateHighlightRender(params: {
  renderId: string
  status: 'ready' | 'failed'
  url?: string | null
  error?: string | null
}): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('content_highlights')
    .update({
      status: params.status,
      video_url: params.url ?? null,
      render_error: params.error ?? null,
    })
    .eq('render_id', params.renderId)

  if (error) {
    log.error('updateHighlightRender failed', error, { renderId: params.renderId })
  }
}
