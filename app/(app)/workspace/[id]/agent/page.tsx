import { notFound } from 'next/navigation'

import { AgentPage } from '@/components/agent/agent-page'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { listConversations } from '@/lib/agent/list-conversations'
import { getPendingWork } from '@/lib/agent/get-pending-work'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'AI Agent' }
export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export default async function AgentPageRoute({ params }: Props) {
  const workspaces = await getWorkspaces()
  const ws = workspaces.find((w) => w.id === params.id)
  if (!ws) notFound()

  const [conversations, pendingWork, recentRunsResult] = await Promise.all([
    listConversations(params.id, 30),
    getPendingWork(params.id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createAdminClient() as any)
      .from('agent_runs')
      .select('id, kind, status, trigger, total_cost_micro_usd, total_tool_calls, started_at, ended_at')
      .eq('workspace_id', params.id)
      .order('started_at', { ascending: false })
      .limit(10),
  ])

  const recentRuns = (recentRunsResult.data ?? []) as Array<Record<string, unknown>>
  const hasRunningRun = recentRuns.some((r) => r.status === 'running')

  return (
    <AgentPage
      workspaceId={params.id}
      conversations={conversations}
      pendingWork={pendingWork}
      recentRuns={recentRuns}
      hasRunningRun={hasRunningRun}
    />
  )
}
