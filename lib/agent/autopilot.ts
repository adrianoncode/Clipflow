import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { buildAgentContextForResume } from '@/lib/agent/context'
import { runAutopilotRun, type AgentRunResult } from '@/lib/agent/run'
import {
  getAutopilotEnabledWorkspaces,
  type AgentSettings,
} from '@/lib/agent/settings'
import type { WorkspaceBudgetOverrides } from '@/lib/agent/budget'
import { log } from '@/lib/log'

interface AutopilotWorkItem {
  trigger: string
  contentId: string
  contentTitle: string
  instruction: string
  allowedTools: string[]
}

export async function findAutopilotWork(
  workspaceId: string,
  settings: AgentSettings,
): Promise<AutopilotWorkItem[]> {
  const admin = createAdminClient()
  const items: AutopilotWorkItem[] = []

  // auto_process: content in status='ready' that has no transcript yet
  if (settings.autoProcess) {
    const { data } = await admin
      .from('content_items')
      .select('id, title')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ready')
      .is('transcript', null)
      .limit(5)
    for (const row of data ?? []) {
      items.push({
        trigger: 'auto_process',
        contentId: row.id,
        contentTitle: row.title ?? 'Untitled',
        instruction: `Start transcription for content "${row.title ?? 'Untitled'}" (ID: ${row.id}). Wait for it to complete.`,
        allowedTools: ['get_content_status', 'start_transcription', 'list_content'],
      })
    }
  }

  // auto_highlights: content with transcript but no highlights
  if (settings.autoHighlights) {
    const { data } = await admin
      .from('content_items')
      .select('id, title')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ready')
      .not('transcript', 'is', null)
      .limit(5)

    for (const row of data ?? []) {
      const { count } = await admin
        .from('content_highlights')
        .select('id', { count: 'exact', head: true })
        .eq('content_id', row.id)
      if ((count ?? 0) === 0) {
        items.push({
          trigger: 'auto_highlights',
          contentId: row.id,
          contentTitle: row.title ?? 'Untitled',
          instruction: `Find highlights in content "${row.title ?? 'Untitled'}" (ID: ${row.id}). Select the best viral moments.`,
          allowedTools: ['get_content_status', 'find_highlights', 'list_content'],
        })
      }
    }
  }

  // auto_drafts: content with highlights but no outputs
  if (settings.autoDrafts) {
    const { data } = await admin
      .from('content_items')
      .select('id, title')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ready')
      .not('transcript', 'is', null)
      .limit(5)

    for (const row of data ?? []) {
      const { count: hlCount } = await admin
        .from('content_highlights')
        .select('id', { count: 'exact', head: true })
        .eq('content_id', row.id)
      if ((hlCount ?? 0) === 0) continue

      const { count: outCount } = await admin
        .from('outputs')
        .select('id', { count: 'exact', head: true })
        .eq('content_id', row.id)
      if ((outCount ?? 0) === 0) {
        const platforms = settings.defaultPublishPlatforms.join(', ')
        items.push({
          trigger: 'auto_drafts',
          contentId: row.id,
          contentTitle: row.title ?? 'Untitled',
          instruction: `Generate drafts for content "${row.title ?? 'Untitled'}" (ID: ${row.id}) on platforms: ${platforms}. Leave them in review state for human approval.`,
          allowedTools: [
            'get_content_status',
            'generate_drafts',
            'list_content',
          ],
        })
      }
    }
  }

  // auto_schedule: approved outputs without a scheduled_for time
  if (settings.autoSchedule) {
    const { data } = await admin
      .from('outputs')
      .select('id, content_id, platform')
      .eq('workspace_id', workspaceId)
      .is('scheduled_for', null)
      .limit(10)

    for (const row of data ?? []) {
      const { data: stateRow } = await admin
        .from('output_states')
        .select('state')
        .eq('output_id', row.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (stateRow?.state === 'approved') {
        items.push({
          trigger: 'auto_schedule',
          contentId: row.content_id,
          contentTitle: `output ${row.id}`,
          instruction: `Schedule approved output ${row.id} (platform: ${row.platform}) for the next available best-time slot. Use schedule_post tool.`,
          allowedTools: ['schedule_post', 'get_content_status', 'list_content'],
        })
      }
    }
  }

  return items
}

function settingsToBudgetOverrides(
  s: AgentSettings,
): WorkspaceBudgetOverrides {
  return {
    autopilotMaxCostMicroUsd: s.autopilotMaxCostPerRunMicroUsd,
    autopilotMaxToolsPerRun: s.autopilotMaxToolsPerRun,
    chatMaxCostMicroUsd: s.chatMaxCostPerConversationMicroUsd,
    chatMaxToolsPerTurn: s.chatMaxToolsPerTurn,
    chatMaxToolsPerRun: s.chatMaxToolsPerRun,
  }
}

async function getWorkspaceOwner(
  workspaceId: string,
): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()
  return data?.user_id ?? null
}

async function hasRecentAutopilotRun(
  workspaceId: string,
  trigger: string,
  contentId: string,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('agent_runs')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('kind', 'autopilot')
    .gte('started_at', oneHourAgo)
    .contains('trigger', { trigger, content_id: contentId })
  return (count ?? 0) > 0
}

export interface AutopilotSweepResult {
  workspacesScanned: number
  workItemsFound: number
  runsStarted: number
  runsFailed: number
  skippedDuplicate: number
}

export async function runAutopilotSweep(): Promise<AutopilotSweepResult> {
  const workspaces = await getAutopilotEnabledWorkspaces()
  const result: AutopilotSweepResult = {
    workspacesScanned: workspaces.length,
    workItemsFound: 0,
    runsStarted: 0,
    runsFailed: 0,
    skippedDuplicate: 0,
  }

  for (const { workspaceId, settings } of workspaces) {
    let items: AutopilotWorkItem[]
    try {
      items = await findAutopilotWork(workspaceId, settings)
    } catch (err) {
      log.error('autopilot findWork failed', err instanceof Error ? err : new Error(String(err)), {
        workspaceId,
      })
      continue
    }
    result.workItemsFound += items.length
    if (items.length === 0) continue

    const ownerId = await getWorkspaceOwner(workspaceId)
    if (!ownerId) {
      log.warn('autopilot sweep: no owner for workspace', { workspaceId })
      continue
    }

    for (const item of items) {
      if (await hasRecentAutopilotRun(workspaceId, item.trigger, item.contentId)) {
        result.skippedDuplicate++
        continue
      }

      const ctxResult = await buildAgentContextForResume({
        workspaceId,
        userId: ownerId,
        runKind: 'autopilot',
      })
      if (!ctxResult.ok) {
        log.warn('autopilot ctx build failed', {
          workspaceId,
          message: ctxResult.message,
        })
        result.runsFailed++
        continue
      }

      let runResult: AgentRunResult
      try {
        runResult = await runAutopilotRun({
          ctx: ctxResult.ctx,
          trigger: {
            name: item.trigger,
            instruction: item.instruction,
            payload: { content_id: item.contentId },
          },
          allowedToolNames: item.allowedTools,
          budgetOverrides: settingsToBudgetOverrides(settings),
        })
      } catch (err) {
        log.error('autopilot run crashed', err instanceof Error ? err : new Error(String(err)), {
          workspaceId,
          trigger: item.trigger,
          contentId: item.contentId,
        })
        result.runsFailed++
        continue
      }

      if (runResult.ok) {
        result.runsStarted++
        log.info('autopilot run completed', {
          workspaceId,
          trigger: item.trigger,
          contentId: item.contentId,
          runId: runResult.runId,
          cost: runResult.cost.costMicroUsd.toString(),
        })
      } else {
        result.runsFailed++
        log.warn('autopilot run failed', {
          workspaceId,
          trigger: item.trigger,
          contentId: item.contentId,
          code: runResult.code,
          message: runResult.message,
        })
      }
    }
  }

  return result
}
