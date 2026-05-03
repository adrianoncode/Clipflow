import { cookies } from 'next/headers'

import {
  SettingsSection,
  SettingsFootnote,
} from '@/components/settings/section'
import { AgentSettingsForm } from '@/components/settings/agent-settings-form'
import { AgentActivityLog } from '@/components/settings/agent-activity-log'
import { getAgentSettings } from '@/lib/agent/settings'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { createAdminClient } from '@/lib/supabase/admin'
import { Shield, Bot } from 'lucide-react'

export const metadata = {
  title: 'Agent',
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

export default async function AgentSettingsPage() {
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  if (!currentWorkspace) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">No workspace selected.</p>
      </div>
    )
  }

  const settings = await getAgentSettings(currentWorkspace.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data: recentRuns } = await admin
    .from('agent_runs')
    .select('id, kind, status, trigger, total_cost_micro_usd, total_tool_calls, started_at, ended_at, error')
    .eq('workspace_id', currentWorkspace.id)
    .order('started_at', { ascending: false })
    .limit(20)

  const { data: recentCosts } = await admin
    .from('agent_runs')
    .select('total_cost_micro_usd')
    .eq('workspace_id', currentWorkspace.id)
    .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const dailyCostMicro = ((recentCosts ?? []) as Array<Record<string, unknown>>).reduce(
    (sum: number, r: Record<string, unknown>) => sum + Number(r.total_cost_micro_usd ?? 0),
    0,
  )

  return (
    <div className="space-y-10">
      <SettingsSection
        index="01"
        title="Auto-Pilot"
        hint="Enable automatic pipeline steps. The agent runs every 15 minutes and processes pending work."
        icon={<Bot className="h-3.5 w-3.5" />}
      >
        <AgentSettingsForm
          settings={{
            autoProcess: settings.autoProcess,
            autoHighlights: settings.autoHighlights,
            autoDrafts: settings.autoDrafts,
            autoSchedule: settings.autoSchedule,
            defaultPublishPlatforms: settings.defaultPublishPlatforms,
            chatMaxCostDollars: Number(settings.chatMaxCostPerConversationMicroUsd) / 1_000_000,
            autopilotMaxCostDollars: Number(settings.autopilotMaxCostPerRunMicroUsd) / 1_000_000,
          }}
        />
      </SettingsSection>

      <SettingsFootnote icon={<Shield className="h-3.5 w-3.5" />}>
        The approve step is always human-only — the agent will never auto-approve drafts.
        All runs use your workspace&apos;s BYOK AI key. Costs are billed directly by your provider.
      </SettingsFootnote>

      <SettingsSection
        index="02"
        title="Activity"
        hint={`$${(dailyCostMicro / 1_000_000).toFixed(4)} spent in the last 24 hours`}
      >
        <AgentActivityLog
          runs={(recentRuns ?? []) as Array<Record<string, unknown>>}
        />
      </SettingsSection>
    </div>
  )
}
