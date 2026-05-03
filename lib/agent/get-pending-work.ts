import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export interface PendingWorkItem {
  type: 'process' | 'highlights' | 'drafts' | 'schedule'
  contentId: string
  title: string
  message: string
}

export async function getPendingWork(workspaceId: string): Promise<PendingWorkItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const items: PendingWorkItem[] = []

  const [readyNoTranscript, readyWithTranscript, approvedOutputs] = await Promise.all([
    admin
      .from('content_items')
      .select('id, title')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ready')
      .is('transcript', null)
      .limit(5),
    admin
      .from('content_items')
      .select('id, title')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ready')
      .not('transcript', 'is', null)
      .limit(10),
    admin
      .from('outputs')
      .select('id, content_id, platform')
      .eq('workspace_id', workspaceId)
      .is('scheduled_for', null)
      .limit(10),
  ])

  for (const row of readyNoTranscript.data ?? []) {
    items.push({
      type: 'process',
      contentId: row.id,
      title: row.title ?? 'Untitled',
      message: `Start transcription for "${row.title ?? 'Untitled'}" (ID: ${row.id}).`,
    })
  }

  for (const row of readyWithTranscript.data ?? []) {
    const { count: hlCount } = await admin
      .from('content_highlights')
      .select('id', { count: 'exact', head: true })
      .eq('content_id', row.id)

    if ((hlCount ?? 0) === 0) {
      items.push({
        type: 'highlights',
        contentId: row.id,
        title: row.title ?? 'Untitled',
        message: `Find the best viral moments in "${row.title ?? 'Untitled'}" (ID: ${row.id}).`,
      })
      continue
    }

    const { count: outCount } = await admin
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('content_id', row.id)

    if ((outCount ?? 0) === 0) {
      items.push({
        type: 'drafts',
        contentId: row.id,
        title: row.title ?? 'Untitled',
        message: `Generate drafts for "${row.title ?? 'Untitled'}" (ID: ${row.id}) on all connected platforms.`,
      })
    }
  }

  for (const row of approvedOutputs.data ?? []) {
    const { data: stateRow } = await admin
      .from('output_states')
      .select('state')
      .eq('output_id', row.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (stateRow?.state === 'approved') {
      items.push({
        type: 'schedule',
        contentId: row.content_id,
        title: `Output on ${row.platform}`,
        message: `Schedule approved output ${row.id} (platform: ${row.platform}) at the best time.`,
      })
    }
  }

  return items
}
