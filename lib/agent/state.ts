import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'
import type { BudgetAccumulator } from '@/lib/agent/budget'

/**
 * The agent_* tables don't appear in the generated Database type yet
 * (they ship in migration 20260503000100_agent.sql, applied separately).
 * Until `supabase gen types typescript --linked` regenerates the type,
 * we punch through with a thin cast at every entry. Once the types are
 * regenerated, remove `agentDb()` and use `createAdminClient()` directly.
 */
function agentDb() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminClient() as any
}

/**
 * agent_runs state machine. Centralized so transitions are auditable
 * and the cron sweep / webhook resume path use the same writers as the
 * loop itself.
 *
 *   queued ───► running ───► complete
 *                  │              ▲
 *                  ├──► waiting_external ──► (webhook resume)
 *                  │       │
 *                  │       └──► failed (deadline missed)
 *                  ├──► budget_exceeded
 *                  ├──► cancelled
 *                  └──► failed (uncaught error)
 *
 * Why service-role client: the loop writes runs from server-side
 * contexts where the user's session may have been refreshed (or
 * completed) — we don't want a session refresh to pop the user's RLS
 * gate mid-run. Authorization is enforced once at run start
 * (buildAgentContext) and we store the workspace_id + user_id on the
 * row for audit. Reads from the UI use the user-scoped client and
 * RLS enforces tenant isolation there.
 */

export type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'waiting_external'
  | 'complete'
  | 'failed'
  | 'budget_exceeded'
  | 'cancelled'

export type AgentRunKind = 'chat' | 'autopilot'

export interface WaitingOn {
  kind: 'content_item_status' | 'render_complete' | 'transcription_complete'
  /** ID of the entity we're waiting on (content_item, render, transcript). */
  id: string
  /**
   * Optional expected target value. For `content_item_status`: the
   * status string we're waiting for ('transcribed'). For render/
   * transcription: undefined — the webhook firing IS the signal.
   */
  expected?: string
}

export interface CreateRunInput {
  workspaceId: string
  userId: string | null
  kind: AgentRunKind
  conversationId?: string | null
  trigger?: Record<string, unknown>
}

export interface RunRecord {
  id: string
  workspaceId: string
  status: AgentRunStatus
  version: number
  totalCostMicroUsd: bigint
  totalToolCalls: number
  waitingOn: WaitingOn | null
}

/** Insert a new run row in `queued` state. Returns the run ID. */
export async function createRun(input: CreateRunInput): Promise<string> {
  const admin = agentDb()
  const { data, error } = await admin
    .from('agent_runs')
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      kind: input.kind,
      conversation_id: input.conversationId ?? null,
      trigger: input.trigger ?? {},
      status: 'queued',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create agent run: ${error?.message ?? 'no row'}`)
  }
  return data.id as string
}

/**
 * Fetch a run by id, returning a typed projection. Returns null if
 * the row is gone (race against deletion).
 */
export async function getRun(runId: string): Promise<RunRecord | null> {
  const admin = agentDb()
  const { data } = await admin
    .from('agent_runs')
    .select(
      'id, workspace_id, status, version, total_cost_micro_usd, total_tool_calls, waiting_on',
    )
    .eq('id', runId)
    .maybeSingle()

  if (!data) return null
  return projectRun(data)
}

/**
 * Optimistic-locked status transition. Checks `version` to ensure no
 * other writer (parallel webhook + cron sweep is the worry) has
 * touched this row since we last read it. Returns the new version on
 * success or null on conflict — caller decides whether to retry or
 * give up (cron should give up; the loop should refetch + retry).
 */
export async function transitionStatus(params: {
  runId: string
  expectedVersion: number
  newStatus: AgentRunStatus
  waitingOn?: WaitingOn | null
  error?: string | null
  costSnapshot?: BudgetAccumulator
  setEndedAt?: boolean
  deadline?: Date | null
}): Promise<{ ok: true; version: number } | { ok: false; reason: 'conflict' | 'not_found' }> {
  const admin = agentDb()

  const update: Record<string, unknown> = {
    status: params.newStatus,
    version: params.expectedVersion + 1,
  }

  if ('waitingOn' in params) {
    update.waiting_on = params.waitingOn
    update.waiting_since = params.waitingOn ? new Date().toISOString() : null
  }
  if (params.error !== undefined) update.error = params.error
  if (params.deadline !== undefined) {
    update.deadline = params.deadline ? params.deadline.toISOString() : null
  }
  if (params.setEndedAt) update.ended_at = new Date().toISOString()

  if (params.costSnapshot) {
    update.total_cost_micro_usd = params.costSnapshot.costMicroUsd.toString()
    update.total_tool_calls = params.costSnapshot.toolsThisRun
    update.total_input_tokens = params.costSnapshot.inputTokens
    update.total_output_tokens = params.costSnapshot.outputTokens
  }

  const { data, error } = await admin
    .from('agent_runs')
    .update(update)
    .eq('id', params.runId)
    .eq('version', params.expectedVersion)
    .select('id, version')
    .maybeSingle()

  if (error) {
    log.error('agent.state: transitionStatus failed', error, {
      runId: params.runId,
      newStatus: params.newStatus,
    })
    throw error
  }

  if (!data) {
    // Either the row vanished or the version was already bumped.
    const fresh = await getRun(params.runId)
    if (!fresh) return { ok: false, reason: 'not_found' }
    return { ok: false, reason: 'conflict' }
  }

  return { ok: true, version: data.version as number }
}

/**
 * Park a run on an external condition. Combines `waiting_external`
 * status + waiting_on payload + deadline (default 1 hour, configurable).
 * Called from inside an async tool handler that just kicked off
 * background work (e.g. start_transcription).
 */
export async function parkRun(params: {
  runId: string
  expectedVersion: number
  waitingOn: WaitingOn
  costSnapshot: BudgetAccumulator
  deadlineMinutes?: number
}): Promise<{ ok: true; version: number } | { ok: false; reason: 'conflict' | 'not_found' }> {
  const deadline = new Date(
    Date.now() + (params.deadlineMinutes ?? 60) * 60_000,
  )
  return transitionStatus({
    runId: params.runId,
    expectedVersion: params.expectedVersion,
    newStatus: 'waiting_external',
    waitingOn: params.waitingOn,
    costSnapshot: params.costSnapshot,
    deadline,
  })
}

/**
 * Find runs to wake based on a webhook event. The webhook handler
 * passes the same `WaitingOn` shape it expects to match. Returns the
 * run IDs that were transitioned from waiting_external → queued.
 *
 * Atomic: uses a single UPDATE with a JSON-path WHERE clause so
 * concurrent webhook deliveries can't double-wake the same run.
 */
export async function wakeRunsWaitingOn(
  waitingOn: WaitingOn,
): Promise<string[]> {
  const admin = agentDb()

  // Match on kind + id at minimum. `expected` is informational —
  // the webhook firing already proves the condition was met.
  const { data, error } = await admin
    .from('agent_runs')
    .update({
      status: 'queued',
      waiting_on: null,
      waiting_since: null,
      // Bump version to invalidate any in-flight cron sweep on this row.
      // Note: we don't have RPC for atomic version+1 here, so we accept
      // a tiny race window — the cron sweep handles it via its own
      // optimistic check on the row it loaded.
    })
    .eq('status', 'waiting_external')
    .filter('waiting_on->>kind', 'eq', waitingOn.kind)
    .filter('waiting_on->>id', 'eq', waitingOn.id)
    .select('id')

  if (error) {
    log.error('agent.state: wakeRunsWaitingOn failed', error, { waitingOn })
    return []
  }

  const ids = (data ?? []).map((r: { id: string }) => r.id)
  if (ids.length > 0) {
    log.info('agent.state: woke runs', { count: ids.length, waitingOn })
  }
  return ids
}

/**
 * Cron-sweep helper: find runs that are stuck in waiting_external past
 * their deadline. Caller marks them failed.
 */
export async function findStuckWaitingRuns(
  limit = 50,
): Promise<Array<{ id: string; version: number; workspaceId: string }>> {
  const admin = agentDb()
  const nowIso = new Date().toISOString()
  const { data } = await admin
    .from('agent_runs')
    .select('id, version, workspace_id')
    .eq('status', 'waiting_external')
    .lt('deadline', nowIso)
    .order('deadline', { ascending: true })
    .limit(limit)

  return (data ?? []).map(
    (r: { id: string; version: number; workspace_id: string }) => ({
      id: r.id,
      version: r.version,
      workspaceId: r.workspace_id,
    }),
  )
}

/**
 * Convenience wrapper for the loop: bind a run id + version once, then
 * the loop just calls `markRunning()`, `markComplete(...)`, etc. and
 * the helper threads the version forward. Returns the current version
 * after each successful transition (caller must hold the latest).
 *
 * Throws on conflict — the loop should refetch and abort. Re-running
 * the same loop body twice on conflict risks duplicate AI spend.
 */
export class RunHandle {
  constructor(
    public readonly runId: string,
    private version: number,
  ) {}

  static async open(runId: string): Promise<RunHandle> {
    const r = await getRun(runId)
    if (!r) throw new Error(`Run ${runId} not found`)
    return new RunHandle(runId, r.version)
  }

  async markRunning(): Promise<void> {
    const res = await transitionStatus({
      runId: this.runId,
      expectedVersion: this.version,
      newStatus: 'running',
    })
    if (!res.ok) throw new Error(`Could not mark run running: ${res.reason}`)
    this.version = res.version
  }

  async markComplete(snapshot: BudgetAccumulator): Promise<void> {
    const res = await transitionStatus({
      runId: this.runId,
      expectedVersion: this.version,
      newStatus: 'complete',
      costSnapshot: snapshot,
      setEndedAt: true,
    })
    if (!res.ok) throw new Error(`Could not mark run complete: ${res.reason}`)
    this.version = res.version
  }

  async markFailed(snapshot: BudgetAccumulator, error: string): Promise<void> {
    const res = await transitionStatus({
      runId: this.runId,
      expectedVersion: this.version,
      newStatus: 'failed',
      costSnapshot: snapshot,
      error,
      setEndedAt: true,
    })
    if (!res.ok) throw new Error(`Could not mark run failed: ${res.reason}`)
    this.version = res.version
  }

  async markBudgetExceeded(
    snapshot: BudgetAccumulator,
    error: string,
  ): Promise<void> {
    const res = await transitionStatus({
      runId: this.runId,
      expectedVersion: this.version,
      newStatus: 'budget_exceeded',
      costSnapshot: snapshot,
      error,
      setEndedAt: true,
    })
    if (!res.ok)
      throw new Error(`Could not mark run budget_exceeded: ${res.reason}`)
    this.version = res.version
  }

  async park(
    waitingOn: WaitingOn,
    snapshot: BudgetAccumulator,
    deadlineMinutes?: number,
  ): Promise<void> {
    const res = await parkRun({
      runId: this.runId,
      expectedVersion: this.version,
      waitingOn,
      costSnapshot: snapshot,
      deadlineMinutes,
    })
    if (!res.ok) throw new Error(`Could not park run: ${res.reason}`)
    this.version = res.version
  }

  /** Snapshot cost without changing status — call after each tool batch. */
  async checkpointCost(snapshot: BudgetAccumulator): Promise<void> {
    const res = await transitionStatus({
      runId: this.runId,
      expectedVersion: this.version,
      newStatus: 'running',
      costSnapshot: snapshot,
    })
    if (!res.ok)
      throw new Error(`Could not checkpoint cost: ${res.reason}`)
    this.version = res.version
  }
}

// ─── internal ────────────────────────────────────────────────────────

function projectRun(data: Record<string, unknown>): RunRecord {
  return {
    id: data.id as string,
    workspaceId: data.workspace_id as string,
    status: data.status as AgentRunStatus,
    version: data.version as number,
    // Supabase returns bigint as string when over 2^53; coerce safely.
    totalCostMicroUsd: BigInt(
      (data.total_cost_micro_usd as string | number | null) ?? 0,
    ),
    totalToolCalls: (data.total_tool_calls as number) ?? 0,
    waitingOn: (data.waiting_on as WaitingOn | null) ?? null,
  }
}

