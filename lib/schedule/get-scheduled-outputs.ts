import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { OutputPlatform } from '@/lib/supabase/types'

export interface ScheduledOutput {
  id: string
  platform: OutputPlatform
  body: string | null
  scheduled_for: string
  content_id: string
  content_title: string | null
}

/**
 * Returns all outputs with a scheduled_for date, ordered chronologically.
 * Also joins the content item title for display.
 */
export async function getScheduledOutputs(workspaceId: string): Promise<ScheduledOutput[]> {
  const supabase = await createClient()

  const { data: outputs, error } = await supabase
    .from('outputs')
    .select('id, platform, body, scheduled_for, content_id')
    .eq('workspace_id', workspaceId)
    .not('scheduled_for', 'is', null)
    .order('scheduled_for', { ascending: true })

  if (error || !outputs || outputs.length === 0) return []

  const contentIds = [...new Set(outputs.map((o) => o.content_id))]
  const { data: contents } = await supabase
    .from('content_items')
    .select('id, title')
    .in('id', contentIds)

  const titleMap = new Map<string, string | null>()
  for (const c of contents ?? []) {
    titleMap.set(c.id, c.title)
  }

  return outputs
    .filter((o) => o.scheduled_for !== null)
    .map((o) => ({
      id: o.id,
      platform: o.platform as OutputPlatform,
      body: o.body,
      scheduled_for: o.scheduled_for as string,
      content_id: o.content_id,
      content_title: titleMap.get(o.content_id) ?? null,
    }))
}
