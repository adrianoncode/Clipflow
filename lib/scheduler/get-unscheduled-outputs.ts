import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface UnscheduledOutput {
  id: string
  platform: string
  body: string | null
  contentTitle: string | null
  latestState: string
}

/**
 * Returns approved/exported outputs that have NOT yet been scheduled
 * (no row in scheduled_posts for the same output_id).
 */
export async function getUnscheduledOutputs(
  workspaceId: string,
): Promise<UnscheduledOutput[]> {
  const supabase = await createClient()

  // 1. Get all output IDs that already have a scheduled_post
  const { data: scheduledRows } = await supabase
    .from('scheduled_posts')
    .select('output_id')
    .eq('workspace_id', workspaceId)
    .not('status', 'eq', 'cancelled')

  const scheduledOutputIds = new Set(
    (scheduledRows ?? []).map((r) => r.output_id),
  )

  // 2. Get all outputs in this workspace. Soft-deleted outputs (and
  // outputs whose content_item was soft-deleted) must not surface as
  // "available to schedule" — we filter both here and on the content
  // title lookup below.
  const { data: outputs } = await supabase
    .from('outputs')
    .select('id, platform, body, content_id')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  if (!outputs?.length) return []

  // 3. Get latest state for each output
  const outputIds = outputs.map((o) => o.id)
  const { data: states } = await supabase
    .from('output_states')
    .select('output_id, state, created_at')
    .in('output_id', outputIds)
    .order('created_at', { ascending: false })

  const latestStateMap = new Map<string, string>()
  for (const row of states ?? []) {
    if (!latestStateMap.has(row.output_id)) {
      latestStateMap.set(row.output_id, row.state)
    }
  }

  // 4. Filter to approved/exported AND not already scheduled
  const eligible = outputs.filter((o) => {
    const state = latestStateMap.get(o.id)
    return (
      (state === 'approved' || state === 'exported') &&
      !scheduledOutputIds.has(o.id)
    )
  })

  if (eligible.length === 0) return []

  // 5. Resolve content titles — also filter soft-deleted content so
  // an output tied to trashed content doesn't slip through with a null
  // title (the eligible list is already filtered, but the content-side
  // filter is defense-in-depth in case the reaper timing diverges).
  const contentIds = [...new Set(eligible.map((o) => o.content_id))]
  const { data: contents } = await supabase
    .from('content_items')
    .select('id, title')
    .in('id', contentIds)
    .is('deleted_at', null)

  const titleMap = new Map<string, string | null>()
  for (const c of contents ?? []) titleMap.set(c.id, c.title)

  return eligible.map((o) => ({
    id: o.id,
    platform: o.platform,
    body: o.body,
    contentTitle: titleMap.get(o.content_id) ?? null,
    latestState: latestStateMap.get(o.id) ?? 'approved',
  }))
}
