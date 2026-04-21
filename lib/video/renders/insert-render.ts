import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { RenderKind, RenderPriority, RenderProvider } from '@/lib/supabase/types'
import { log } from '@/lib/log'

export interface InsertRenderParams {
  workspaceId: string
  contentId: string | null
  kind: RenderKind
  provider?: RenderProvider
  providerRenderId: string | null
  /** Dispatch priority captured at submit time — 'high' is the Studio
   *  benefit. Recording it on the row (not derived from the current
   *  plan at read-time) means a plan downgrade mid-render doesn't
   *  retroactively demote an in-flight job. */
  priority?: RenderPriority
  /** Freeform — aspect ratio, source URL, etc. Shown in the history card. */
  metadata?: Record<string, unknown>
}

/**
 * Creates a `renders` row in `status='rendering'`. Called right after a
 * Shotstack/Replicate submit, so the user gets an entry in their render
 * history even before the cloud job finishes.
 *
 * Returns the new render row id, or null on failure (we never throw —
 * a broken DB insert must not kill the render itself).
 */
export async function insertRender(params: InsertRenderParams): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('renders')
      .insert({
        workspace_id: params.workspaceId,
        content_id: params.contentId,
        kind: params.kind,
        provider: params.provider ?? 'shotstack',
        provider_render_id: params.providerRenderId,
        status: 'rendering',
        priority: params.priority ?? 'normal',
        metadata: (params.metadata ?? {}) as never,
      })
      .select('id')
      .single()

    if (error) {
      log.error('insertRender failed', error)
      return null
    }
    return (data as { id: string } | null)?.id ?? null
  } catch (err) {
    log.error('insertRender unexpected', err)
    return null
  }
}
