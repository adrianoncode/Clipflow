import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import type { WorkspaceRole } from '@/lib/auth/require-workspace-member'

type SupabaseServerClient = ReturnType<typeof createClient>

/**
 * Per-run context handed to every agent tool. Built once at run start
 * by `buildAgentContext()`, then re-validated on each tool invocation
 * via `assertStillMember()` — this catches role downgrades that happen
 * mid-run (e.g. the user is removed from the workspace while the agent
 * is in the middle of a 30-second tool call).
 *
 * Tool handlers should NEVER carry the context across async boundaries
 * without re-asserting. The supabase client embedded here uses the
 * caller's session — RLS still applies. Service-role escapes only
 * inside well-justified utilities (audit log, cron-driven mutations).
 */
export interface AgentContext {
  workspaceId: string
  userId: string
  role: WorkspaceRole
  supabase: SupabaseServerClient
  /**
   * Run kind discriminator — propagated to telemetry. Some tools may
   * additionally restrict themselves based on this (e.g. an autopilot
   * run scoped to "Auto-Highlights" should only see read tools + the
   * highlights tool, even if the chat surface exposes more).
   */
  runKind: 'chat' | 'autopilot'
}

/** Result type matches `requireWorkspaceMember` for consistency. */
export type BuildContextResult =
  | { ok: true; ctx: AgentContext }
  | { ok: false; status: 401 | 403; message: string }

/**
 * Builds an AgentContext from the current request session. Use at the
 * top of an agent entry point (chat route, autopilot tick) — once the
 * context is built, the loop hands it to every tool handler.
 */
export async function buildAgentContext(params: {
  workspaceId: string | null | undefined
  runKind: 'chat' | 'autopilot'
}): Promise<BuildContextResult> {
  if (!params.workspaceId) {
    return { ok: false, status: 403, message: 'Workspace required.' }
  }

  const user = await getUser()
  if (!user) {
    return { ok: false, status: 401, message: 'Not authenticated.' }
  }

  const supabase = createClient()
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', params.workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) {
    return {
      ok: false,
      status: 403,
      message: 'You are not a member of this workspace.',
    }
  }

  return {
    ok: true,
    ctx: {
      workspaceId: params.workspaceId,
      userId: user.id,
      role: data.role as WorkspaceRole,
      supabase,
      runKind: params.runKind,
    },
  }
}

/**
 * Build an AgentContext WITHOUT a user JWT — used by the webhook /
 * cron resume path where the original chat user isn't online. Trusts
 * the caller to have validated `userId` came from a real prior run
 * (we never accept this path from user input). RLS bypass is by
 * service-role; we still re-check workspace membership against the
 * `workspace_members` table so a removed user can't keep waking
 * parked runs after losing access.
 */
export async function buildAgentContextForResume(params: {
  workspaceId: string
  userId: string
  runKind: 'chat' | 'autopilot'
}): Promise<BuildContextResult> {
  if (!params.workspaceId) {
    return { ok: false, status: 403, message: 'Workspace required.' }
  }

  const supabase = createClient()
  // Membership re-check against the user the original run captured.
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', params.workspaceId)
    .eq('user_id', params.userId)
    .maybeSingle()

  if (!data) {
    return {
      ok: false,
      status: 403,
      message:
        'Resumed run’s user is no longer a member of this workspace.',
    }
  }

  return {
    ok: true,
    ctx: {
      workspaceId: params.workspaceId,
      userId: params.userId,
      role: data.role as WorkspaceRole,
      supabase,
      runKind: params.runKind,
    },
  }
}

/**
 * Re-validate that the user is still a member of the workspace and
 * fetch their CURRENT role (not the cached one). Call from inside any
 * mutating tool handler before doing work — covers mid-run role
 * downgrades and revoked memberships.
 *
 * Returns the fresh role (which may differ from `ctx.role` set at run
 * start). Mutates `ctx.role` in-place so subsequent calls in the same
 * tool see the latest value.
 */
export async function assertStillMember(
  ctx: AgentContext,
): Promise<{ ok: true; role: WorkspaceRole } | { ok: false; reason: string }> {
  const { data } = await ctx.supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', ctx.workspaceId)
    .eq('user_id', ctx.userId)
    .maybeSingle()

  if (!data) {
    return { ok: false, reason: 'Workspace membership revoked mid-run.' }
  }

  const role = data.role as WorkspaceRole
  ctx.role = role
  return { ok: true, role }
}

/**
 * Editor-or-above gate. Use inside mutating tool handlers AFTER
 * `assertStillMember()` returns ok. Reviewers can read but not write
 * (consistent with the Approve-step boundary — reviewers can flip
 * draft → approved, but full content mutation is editor+).
 */
export function requireEditor(ctx: AgentContext): void {
  if (ctx.role !== 'owner' && ctx.role !== 'editor') {
    throw new ToolPermissionError(
      `Tool requires editor or owner role; you are ${ctx.role}.`,
    )
  }
}

/**
 * Owner-only gate. Use for tools that touch workspace settings, AI
 * keys, billing, etc.
 */
export function requireOwner(ctx: AgentContext): void {
  if (ctx.role !== 'owner') {
    throw new ToolPermissionError(
      `Tool requires owner role; you are ${ctx.role}.`,
    )
  }
}

/**
 * Thrown by tool handlers when the caller's role doesn't permit the
 * action. The agent loop catches this and surfaces it as a tool_result
 * with `is_error: true`, so the model sees a structured refusal rather
 * than an opaque crash and can either give up or try a different
 * approach.
 */
export class ToolPermissionError extends Error {
  readonly code = 'TOOL_PERMISSION_DENIED' as const
  constructor(message: string) {
    super(message)
    this.name = 'ToolPermissionError'
  }
}
