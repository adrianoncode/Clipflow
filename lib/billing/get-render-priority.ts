import 'server-only'

import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import type { RenderPriority } from '@/lib/supabase/types'

/**
 * Resolve the render dispatch priority for a workspace based on its
 * current billing plan. Studio (agency) gets 'high' — both as a hint
 * to Shotstack and as a signal to our client-side poller to check
 * status more frequently. Everyone else gets 'normal'.
 *
 * Defensive: if the subscription lookup fails for any reason, we fall
 * back to 'normal' rather than surfacing an error — priority is a
 * nice-to-have, not a correctness-critical property.
 */
export async function getRenderPriorityForWorkspace(
  workspaceId: string,
): Promise<RenderPriority> {
  try {
    const plan = await getWorkspacePlan(workspaceId)
    return plan === 'agency' ? 'high' : 'normal'
  } catch {
    return 'normal'
  }
}
