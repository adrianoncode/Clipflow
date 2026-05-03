import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'
import type { Json, OutputState } from '@/lib/supabase/types'
import type { OutputPlatform } from '@/lib/platforms'

export interface OutputRow {
  id: string
  content_id: string
  workspace_id: string
  platform: OutputPlatform
  body: string | null
  metadata: Json
  created_at: string
  updated_at: string
  latest_state: OutputState | null
}

/**
 * Lists outputs for a given content item, ordered by platform, with
 * each row enriched with its latest `output_states.state`.
 *
 * Implementation note: Supabase-js doesn't express lateral subqueries
 * cleanly, so this runs two queries and zips in JS. The extra round
 * trip is cheap at M4 scale (4 outputs max per content item) and the
 * code is trivial to read. M4 only ever writes `state='draft'`, so the
 * enrichment is cosmetic today — but wiring the join now means M5
 * (review/approved/exported) lands without touching this file.
 */
export const getOutputs = cache(
  async (contentId: string, workspaceId: string): Promise<OutputRow[]> => {
    const supabase = createClient()

    const { data: outputs, error: outputsError } = await supabase
      .from('outputs')
      .select('id, content_id, workspace_id, platform, body, metadata, created_at, updated_at')
      .eq('content_id', contentId)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)

    if (outputsError) {
      log.error('getOutputs.outputs failed', outputsError, { workspaceId, contentId })
      return []
    }

    const rows = outputs ?? []
    if (rows.length === 0) return []

    const outputIds = rows.map((row) => row.id)
    const { data: states, error: statesError } = await supabase
      .from('output_states')
      .select('output_id, state, created_at')
      .in('output_id', outputIds)
      .order('created_at', { ascending: false })

    if (statesError) {
      log.error('getOutputs.states failed', statesError, { workspaceId, contentId })
    }

    const latestByOutput = new Map<string, OutputState>()
    for (const row of states ?? []) {
      if (!latestByOutput.has(row.output_id)) {
        latestByOutput.set(row.output_id, row.state as OutputState)
      }
    }

    const platformOrder: OutputPlatform[] = [
      'tiktok',
      'instagram_reels',
      'youtube_shorts',
      'linkedin',
    ]

    return rows
      .map<OutputRow>((row) => ({
        id: row.id,
        content_id: row.content_id,
        workspace_id: row.workspace_id,
        platform: row.platform as OutputPlatform,
        body: row.body,
        metadata: row.metadata as Json,
        created_at: row.created_at,
        updated_at: row.updated_at,
        latest_state: latestByOutput.get(row.id) ?? null,
      }))
      .sort(
        (a, b) =>
          platformOrder.indexOf(a.platform) - platformOrder.indexOf(b.platform),
      )
  },
)
