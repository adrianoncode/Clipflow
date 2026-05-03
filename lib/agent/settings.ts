import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export interface AgentSettings {
  workspaceId: string
  autoProcess: boolean
  autoHighlights: boolean
  autoDrafts: boolean
  autoSchedule: boolean
  defaultPublishPlatforms: string[]
  chatMaxCostPerConversationMicroUsd: bigint
  autopilotMaxCostPerRunMicroUsd: bigint
  chatMaxToolsPerTurn: number
  chatMaxToolsPerRun: number
  autopilotMaxToolsPerRun: number
  agentModel: string | null
  updatedAt: string
}

const DEFAULTS: Omit<AgentSettings, 'workspaceId' | 'updatedAt'> = {
  autoProcess: false,
  autoHighlights: false,
  autoDrafts: false,
  autoSchedule: false,
  defaultPublishPlatforms: ['linkedin'],
  chatMaxCostPerConversationMicroUsd: 500_000n,
  autopilotMaxCostPerRunMicroUsd: 5_000_000n,
  chatMaxToolsPerTurn: 8,
  chatMaxToolsPerRun: 25,
  autopilotMaxToolsPerRun: 12,
  agentModel: null,
}

function rowToSettings(
  workspaceId: string,
  row: Record<string, unknown> | null,
): AgentSettings {
  if (!row) {
    return {
      ...DEFAULTS,
      workspaceId,
      updatedAt: new Date().toISOString(),
    }
  }
  return {
    workspaceId,
    autoProcess: row.auto_process as boolean,
    autoHighlights: row.auto_highlights as boolean,
    autoDrafts: row.auto_drafts as boolean,
    autoSchedule: row.auto_schedule as boolean,
    defaultPublishPlatforms: (row.default_publish_platforms as string[]) ?? ['linkedin'],
    chatMaxCostPerConversationMicroUsd: BigInt(
      (row.chat_max_cost_per_conversation_micro_usd as number | string) ?? 500_000,
    ),
    autopilotMaxCostPerRunMicroUsd: BigInt(
      (row.autopilot_max_cost_per_run_micro_usd as number | string) ?? 5_000_000,
    ),
    chatMaxToolsPerTurn: (row.chat_max_tools_per_turn as number) ?? 8,
    chatMaxToolsPerRun: (row.chat_max_tools_per_run as number) ?? 25,
    autopilotMaxToolsPerRun: (row.autopilot_max_tools_per_run as number) ?? 12,
    agentModel: (row.agent_model as string | null) ?? null,
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  }
}

export async function getAgentSettings(
  workspaceId: string,
): Promise<AgentSettings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data } = await admin
    .from('agent_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  return rowToSettings(workspaceId, data as Record<string, unknown> | null)
}

export interface UpdateAgentSettingsInput {
  autoProcess?: boolean
  autoHighlights?: boolean
  autoDrafts?: boolean
  autoSchedule?: boolean
  defaultPublishPlatforms?: string[]
  chatMaxCostPerConversationMicroUsd?: bigint
  autopilotMaxCostPerRunMicroUsd?: bigint
  chatMaxToolsPerTurn?: number
  chatMaxToolsPerRun?: number
  autopilotMaxToolsPerRun?: number
  agentModel?: string | null
}

export async function updateAgentSettings(
  workspaceId: string,
  input: UpdateAgentSettingsInput,
): Promise<AgentSettings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const patch: Record<string, unknown> = {}

  if (input.autoProcess !== undefined) patch.auto_process = input.autoProcess
  if (input.autoHighlights !== undefined) patch.auto_highlights = input.autoHighlights
  if (input.autoDrafts !== undefined) patch.auto_drafts = input.autoDrafts
  if (input.autoSchedule !== undefined) patch.auto_schedule = input.autoSchedule
  if (input.defaultPublishPlatforms !== undefined)
    patch.default_publish_platforms = input.defaultPublishPlatforms
  if (input.chatMaxCostPerConversationMicroUsd !== undefined)
    patch.chat_max_cost_per_conversation_micro_usd =
      input.chatMaxCostPerConversationMicroUsd.toString()
  if (input.autopilotMaxCostPerRunMicroUsd !== undefined)
    patch.autopilot_max_cost_per_run_micro_usd =
      input.autopilotMaxCostPerRunMicroUsd.toString()
  if (input.chatMaxToolsPerTurn !== undefined)
    patch.chat_max_tools_per_turn = input.chatMaxToolsPerTurn
  if (input.chatMaxToolsPerRun !== undefined)
    patch.chat_max_tools_per_run = input.chatMaxToolsPerRun
  if (input.autopilotMaxToolsPerRun !== undefined)
    patch.autopilot_max_tools_per_run = input.autopilotMaxToolsPerRun
  if (input.agentModel !== undefined) patch.agent_model = input.agentModel

  const { data } = await admin
    .from('agent_settings')
    .upsert({ workspace_id: workspaceId, ...patch }, { onConflict: 'workspace_id' })
    .select('*')
    .single()

  return rowToSettings(workspaceId, data as Record<string, unknown> | null)
}

export async function getAutopilotEnabledWorkspaces(): Promise<
  Array<{ workspaceId: string; settings: AgentSettings }>
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data } = await admin
    .from('agent_settings')
    .select('*')
    .or('auto_process.eq.true,auto_highlights.eq.true,auto_drafts.eq.true,auto_schedule.eq.true')

  if (!data || data.length === 0) return []
  return (data as Array<Record<string, unknown>>).map((row) => ({
    workspaceId: row.workspace_id as string,
    settings: rowToSettings(row.workspace_id as string, row),
  }))
}
