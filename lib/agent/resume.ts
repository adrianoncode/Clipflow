import 'server-only'

import { buildAgentContextForResume } from '@/lib/agent/context'
import { runChatTurn } from '@/lib/agent/run'
import { getRun, transitionStatus } from '@/lib/agent/state'
import {
  loadConversationMessages,
  persistAgentMessage,
  persistNewTurns,
} from '@/lib/agent/messages'
import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'

export type ResumeRunResult =
  | {
      ok: true
      runId: string
      finalText: string
      parked?: boolean
      noted?: string
    }
  | { ok: false; code: string; message: string }

/**
 * Continue a previously-parked agent run. Used by both the
 * `/api/agent/resume` HTTP route (called from webhooks) and the
 * `/api/cron/agent-tick` sweep (fallback when a webhook drops).
 *
 * Idempotent: if the run is no longer in `queued` state we early-return
 * with a noted reason. Multiple webhook deliveries safely no-op past
 * the first.
 */
export async function resumeRun(runId: string): Promise<ResumeRunResult> {
  const run = await getRun(runId)
  if (!run) {
    return { ok: false, code: 'not_found', message: `Run ${runId} not found.` }
  }
  if (run.status !== 'queued') {
    return {
      ok: true,
      runId,
      finalText: '',
      noted: `Run not in queued state (was ${run.status}); nothing to do.`,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data: rowExt } = await admin
    .from('agent_runs')
    .select('conversation_id, user_id, workspace_id, kind')
    .eq('id', runId)
    .maybeSingle()

  const conversationId = rowExt?.conversation_id as string | null
  const userId = rowExt?.user_id as string | null
  const workspaceId = (rowExt?.workspace_id as string | null) ?? run.workspaceId
  const kind = rowExt?.kind as 'chat' | 'autopilot' | null

  if (!conversationId || !userId || !kind) {
    return {
      ok: false,
      code: 'incomplete_run_row',
      message: 'Run row missing conversation_id, user_id, or kind.',
    }
  }
  if (kind !== 'chat') {
    return {
      ok: true,
      runId,
      finalText: '',
      noted: 'Autopilot resume is Phase 3 work; left for cron sweep.',
    }
  }

  // Mark the OLD parked run complete — its purpose was to hold the
  // tool_result that's already in agent_messages. The new
  // continuation run takes it from here.
  await transitionStatus({
    runId,
    expectedVersion: run.version,
    newStatus: 'complete',
    setEndedAt: true,
  })

  const ctxResult = await buildAgentContextForResume({
    workspaceId,
    userId,
    runKind: 'chat',
  })
  if (!ctxResult.ok) {
    log.error('resumeRun context build failed', new Error(ctxResult.message), {
      runId,
      workspaceId,
      userId,
    })
    return {
      ok: false,
      code: 'context_failed',
      message: ctxResult.message,
    }
  }

  const priorMessages = await loadConversationMessages(conversationId)
  const priorLength = priorMessages.length

  const continuationPrompt =
    'The async operation you started earlier has completed. Inspect the latest tool result above and continue with the user’s original goal.'

  await persistAgentMessage({
    conversationId,
    runId: null,
    role: 'user',
    content: { blocks: [{ type: 'text', text: continuationPrompt }] },
  })

  const result = await runChatTurn({
    ctx: ctxResult.ctx,
    conversationId,
    priorMessages,
    userMessage: continuationPrompt,
  })

  if (result.ok) {
    await persistNewTurns({
      conversationId,
      runId: result.runId,
      allMessages: result.messages,
      priorLength: priorLength + 1,
    }).catch((err) => {
      log.error('resumeRun persistNewTurns failed', err, {
        conversationId,
        runId: result.runId,
      })
    })
    return {
      ok: true,
      runId: result.runId,
      finalText: result.finalText,
      parked: !!result.parked,
    }
  }

  return {
    ok: false,
    code: result.code,
    message: result.message,
  }
}
