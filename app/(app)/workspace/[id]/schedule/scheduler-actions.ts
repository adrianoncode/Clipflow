'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import {
  listPinterestBoards,
  type PinterestBoard,
} from '@/lib/publish/composio-publish'
import { generatePlan } from '@/lib/planner/generate-plan'
import {
  attachDraftsToSlots,
  pickCandidateSlots,
  type ApprovedDraftPreview,
  type PlanSlot,
} from '@/lib/planner/build-plan'
import { OUTPUT_PLATFORMS, type OutputPlatform } from '@/lib/platforms'
import { getUnscheduledOutputs } from '@/lib/scheduler/get-unscheduled-outputs'

// ---------------------------------------------------------------------------
// fetchPinterestBoardsAction — read-only helper for the schedule UI.
// Returns the user's Pinterest boards via Composio. Cheap-ish: hits
// Pinterest once per call. The dialog calls it lazily on open.
// ---------------------------------------------------------------------------

export async function fetchPinterestBoardsAction(
  workspaceId: string,
): Promise<
  | { ok: true; boards: PinterestBoard[] }
  | { ok: false; error: string }
> {
  if (!workspaceId) return { ok: false, error: 'No workspace.' }
  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return { ok: false, error: 'Not a member.' }

  try {
    const boards = await listPinterestBoards(workspaceId)
    return { ok: true, boards }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to load boards.',
    }
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SchedulerActionState =
  | { ok?: undefined }
  | { ok: true; message?: string }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// schedulePostAction
// ---------------------------------------------------------------------------

const schedulePostSchema = z.object({
  workspaceId: z.string().uuid(),
  outputId: z.string().uuid(),
  platform: z.string().min(1),
  scheduledFor: z.string().min(1),
  socialAccountId: z.string().uuid().optional(),
  // Pinterest only — required when platform === 'pinterest', otherwise
  // we have no way to know which board the pin should land on. The UI
  // enforces this via a board picker; we double-check on the server.
  pinterestBoardId: z.string().min(1).optional(),
})

export async function schedulePostAction(
  _prev: SchedulerActionState,
  formData: FormData,
): Promise<SchedulerActionState> {
  const raw = {
    workspaceId: formData.get('workspace_id')?.toString() ?? '',
    outputId: formData.get('output_id')?.toString() ?? '',
    platform: formData.get('platform')?.toString() ?? '',
    scheduledFor: formData.get('scheduled_for')?.toString() ?? '',
    socialAccountId: formData.get('social_account_id')?.toString() || undefined,
    pinterestBoardId:
      formData.get('pinterest_board_id')?.toString() || undefined,
  }

  const parsed = schedulePostSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, outputId, platform, scheduledFor, socialAccountId, pinterestBoardId } =
    parsed.data

  // Server-side guard: Pinterest pins MUST have a board picked. The
  // UI prevents submitting without one, but a tampered request would
  // otherwise create an unschedulable scheduled_posts row.
  if (platform === 'pinterest' && !pinterestBoardId) {
    return {
      ok: false,
      error: 'Pinterest pins need a board — pick one before scheduling.',
    }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Verify the output belongs to the workspace
  const { data: output, error: outputError } = await supabase
    .from('outputs')
    .select('id')
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (outputError || !output) {
    return { ok: false, error: 'Output not found in this workspace.' }
  }

  // Pinterest's board choice rides along in the metadata JSONB column —
  // the publish worker reads it back at fire-time and passes it as
  // pinterestBoardId to the Composio publish action. Other platforms
  // get a clean empty metadata object.
  const metadata: Record<string, string> = {}
  if (platform === 'pinterest' && pinterestBoardId) {
    metadata.pinterest_board_id = pinterestBoardId
  }

  const { error } = await supabase.from('scheduled_posts').insert({
    workspace_id: workspaceId,
    output_id: outputId,
    platform,
    scheduled_for: new Date(scheduledFor).toISOString(),
    social_account_id: socialAccountId ?? null,
    status: 'scheduled',
    created_by: user.id,
    metadata,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  return { ok: true, message: `Scheduled for ${new Date(scheduledFor).toLocaleString()}` }
}

// ---------------------------------------------------------------------------
// cancelScheduledPostAction
// ---------------------------------------------------------------------------

const cancelSchema = z.object({
  workspaceId: z.string().uuid(),
  postId: z.string().uuid(),
})

export async function cancelScheduledPostAction(
  _prev: SchedulerActionState,
  formData: FormData,
): Promise<SchedulerActionState> {
  const raw = {
    workspaceId: formData.get('workspace_id')?.toString() ?? '',
    postId: formData.get('post_id')?.toString() ?? '',
  }

  const parsed = cancelSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, postId } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Verify membership
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || !['owner', 'editor'].includes(member.role)) {
    return { ok: false, error: 'Insufficient permissions.' }
  }

  const { error } = await supabase
    .from('scheduled_posts')
    .update({ status: 'cancelled' })
    .eq('id', postId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'scheduled')

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// retryFailedPostAction — re-queue a post whose publish exhausted retries.
// Flips status='failed' → 'scheduled', resets retry_count + next_retry_at,
// and snaps `scheduled_for` to "now + 1 minute" so the cron picks it up
// on the next tick. The user's last-known scheduled time is replaced
// with "as soon as possible" because by definition we're past it.
// ---------------------------------------------------------------------------

const retryFailedSchema = z.object({
  workspaceId: z.string().uuid(),
  postId: z.string().uuid(),
})

export async function retryFailedPostAction(
  _prev: SchedulerActionState,
  formData: FormData,
): Promise<SchedulerActionState> {
  const parsed = retryFailedSchema.safeParse({
    workspaceId: formData.get('workspace_id')?.toString() ?? '',
    postId: formData.get('post_id')?.toString() ?? '',
  })
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input.' }
  }
  const { workspaceId, postId } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  const member = await requireWorkspaceMember(workspaceId)
  if (!member.ok) return { ok: false, error: 'Not a workspace member.' }
  if (!['owner', 'editor'].includes(member.role)) {
    return { ok: false, error: 'Your role cannot retry posts.' }
  }

  const supabase = await createClient()

  // Read current version for the CAS-style update — see publish-cron
  // route for the version-based lock pattern.
  const { data: current } = await supabase
    .from('scheduled_posts')
    .select('version, status')
    .eq('id', postId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!current) return { ok: false, error: 'Post not found.' }
  if (current.status !== 'failed') {
    return { ok: false, error: 'Only failed posts can be retried.' }
  }

  // Schedule for ~1 minute from now so the cron picks it up on the
  // next tick. Bump version so any in-flight cron lock misses.
  const inOneMinute = new Date(Date.now() + 60_000).toISOString()
  const { error } = await supabase
    .from('scheduled_posts')
    .update({
      status: 'scheduled',
      scheduled_for: inOneMinute,
      retry_count: 0,
      next_retry_at: null,
      error_message: null,
      version: (current.version ?? 0) + 1,
    })
    .eq('id', postId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'failed')

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  return { ok: true, message: 'Re-queued — publishing within a minute.' }
}

// ---------------------------------------------------------------------------
// reschedulePostAction — drag-and-drop: move existing post to a new date/time
// ---------------------------------------------------------------------------

const rescheduleSchema = z.object({
  workspaceId: z.string().uuid(),
  postId: z.string().uuid(),
  scheduledFor: z.string().min(1),
})

export async function reschedulePostAction(
  _prev: SchedulerActionState,
  formData: FormData,
): Promise<SchedulerActionState> {
  const raw = {
    workspaceId: formData.get('workspace_id')?.toString() ?? '',
    postId: formData.get('post_id')?.toString() ?? '',
    scheduledFor: formData.get('scheduled_for')?.toString() ?? '',
  }

  const parsed = rescheduleSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, postId, scheduledFor } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || !['owner', 'editor'].includes(member.role)) {
    return { ok: false, error: 'Insufficient permissions.' }
  }

  // Read the current version so we can bump it. The bump is what lets
  // the cron lock detect a reschedule that lands between its fetch and
  // its lock-update — its CAS predicate `eq('version', snapshot)` will
  // miss after this update and the cron will skip the row instead of
  // firing it at the now-stale time.
  const { data: current } = await supabase
    .from('scheduled_posts')
    .select('version')
    .eq('id', postId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  const { error } = await supabase
    .from('scheduled_posts')
    .update({
      scheduled_for: new Date(scheduledFor).toISOString(),
      version: (current?.version ?? 0) + 1,
    })
    .eq('id', postId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'scheduled')

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  return { ok: true, message: `Rescheduled to ${new Date(scheduledFor).toLocaleString()}` }
}

// ---------------------------------------------------------------------------
// quickScheduleAction — drag unscheduled output onto calendar date
// ---------------------------------------------------------------------------

const quickScheduleSchema = z.object({
  workspaceId: z.string().uuid(),
  outputId: z.string().uuid(),
  platform: z.string().min(1),
  scheduledFor: z.string().min(1),
})

export async function quickScheduleAction(
  _prev: SchedulerActionState,
  formData: FormData,
): Promise<SchedulerActionState> {
  const raw = {
    workspaceId: formData.get('workspace_id')?.toString() ?? '',
    outputId: formData.get('output_id')?.toString() ?? '',
    platform: formData.get('platform')?.toString() ?? '',
    scheduledFor: formData.get('scheduled_for')?.toString() ?? '',
  }

  const parsed = quickScheduleSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, outputId, platform, scheduledFor } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  // Membership + role gate. Reviewers can comment but shouldn't be
  // able to drag posts onto the calendar — that's an editor/owner action.
  const member = await requireWorkspaceMember(workspaceId)
  if (!member.ok) return { ok: false, error: 'Not a workspace member.' }
  if (!['owner', 'editor'].includes(member.role)) {
    return { ok: false, error: 'Your role cannot schedule posts.' }
  }

  const supabase = await createClient()

  // Verify output belongs to workspace
  const { data: output, error: outputError } = await supabase
    .from('outputs')
    .select('id')
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (outputError || !output) {
    return { ok: false, error: 'Output not found in this workspace.' }
  }

  const { error } = await supabase.from('scheduled_posts').insert({
    workspace_id: workspaceId,
    output_id: outputId,
    platform,
    scheduled_for: new Date(scheduledFor).toISOString(),
    status: 'scheduled',
    created_by: user.id,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  return { ok: true, message: `Scheduled for ${new Date(scheduledFor).toLocaleString()}` }
}

// ---------------------------------------------------------------------------
// autoDistributeApprovedAction — picks best-time slots for each unscheduled
// approved draft this week and inserts the scheduled_posts rows. Uses the
// same `pickCandidateSlots` + `attachDraftsToSlots` engine as the AI Plan
// tab, minus the LLM polish — purely deterministic, fast, and free.
// ---------------------------------------------------------------------------

export interface AutoDistributeState
  extends Record<string, unknown> {
  ok?: boolean
  error?: string
  /** Number of drafts that landed in a slot. Smaller than the input
   *  count when no platform-best-time matched a draft's platform. */
  scheduled?: number
}

const autoDistributeSchema = z.object({
  workspaceId: z.string().uuid(),
})

export async function autoDistributeApprovedAction(
  _prev: AutoDistributeState,
  formData: FormData,
): Promise<AutoDistributeState> {
  const parsed = autoDistributeSchema.safeParse({
    workspaceId: formData.get('workspace_id'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId } = parsed.data
  const user = await getUser()
  if (!user) redirect('/login')

  const member = await requireWorkspaceMember(workspaceId)
  if (!member.ok) return { ok: false, error: 'Not a workspace member.' }

  const unscheduled = await getUnscheduledOutputs(workspaceId)
  // Drop anything whose platform isn't in our planner table — the
  // unscheduled list can include exotic kinds (e.g. legacy data) that
  // wouldn't get a slot anyway.
  const plannable = unscheduled.filter((o) =>
    (OUTPUT_PLATFORMS as readonly string[]).includes(o.platform),
  )
  if (plannable.length === 0) {
    return { ok: false, error: 'No approved drafts waiting to schedule.' }
  }

  // Build the planner's view of the drafts. We don't have hooks/tags
  // here, so seed minimal placeholders — pickCandidateSlots only uses
  // platform + count, not body, so the rest doesn't matter for the
  // deterministic pass.
  const draftPreviews: ApprovedDraftPreview[] = plannable.map((o) => ({
    id: o.id,
    platform: o.platform as OutputPlatform,
    hook: o.contentTitle ?? '',
    caption_preview: o.body?.slice(0, 200) ?? '',
    tags: [],
    created_at: new Date().toISOString(),
  }))

  // Anchor the week to the next Monday (so "this week" doesn't try to
  // re-schedule into yesterday's slots that already passed). If today
  // is Monday we use today.
  const now = new Date()
  const weekStarting = new Date(now)
  const dow = now.getDay() // 0=Sun, 1=Mon, ...
  const offsetToMonday = (1 - dow + 7) % 7
  weekStarting.setDate(now.getDate() + offsetToMonday)
  weekStarting.setHours(0, 0, 0, 0)

  const candidates = pickCandidateSlots(
    weekStarting,
    { niche: null, tone: null, timezone: 'UTC' },
    draftPreviews,
  )
  const slots = attachDraftsToSlots(candidates, draftPreviews).filter(
    (s) => s.draftId !== null,
  )

  if (slots.length === 0) {
    return { ok: false, error: 'No matching slots — all platforms at cadence cap or no defaults available.' }
  }

  const supabase = await createClient()
  const rows = slots.map((s) => ({
    workspace_id: workspaceId,
    output_id: s.draftId!,
    platform: s.platform,
    scheduled_for: new Date(`${s.date}T${s.time}:00`).toISOString(),
    status: 'scheduled' as const,
    created_by: user.id,
  }))

  const { error } = await supabase.from('scheduled_posts').insert(rows)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  return { ok: true, scheduled: rows.length }
}

// ---------------------------------------------------------------------------
// generateContentPlanAction — fetches approved drafts + brand context
// for the workspace and asks generatePlan() for next-week slots. Cached
// in workspace.metadata.plan for 24h so reload doesn't re-bill the LLM.
// ---------------------------------------------------------------------------

export interface GeneratePlanState
  extends Record<string, unknown> {
  ok?: boolean
  error?: string
  slots?: PlanSlot[]
  generatedAt?: string
  aiUsed?: boolean
  aiError?: string
  cached?: boolean
}

const generatePlanSchema = z.object({
  workspaceId: z.string().uuid(),
  /** Pass 'true' as a form value to force a re-generation past the cache. */
  forceRefresh: z.string().optional(),
  /** Pass 'true' to short-circuit when no cached plan exists — used by the
   *  auto-load on Plan tab mount so we never silently burn AI credits on
   *  the user's first visit. */
  cacheOnly: z.string().optional(),
})

const PLAN_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export async function generateContentPlanAction(
  _prev: GeneratePlanState,
  formData: FormData,
): Promise<GeneratePlanState> {
  const parsed = generatePlanSchema.safeParse({
    workspaceId: formData.get('workspace_id'),
    forceRefresh: formData.get('force_refresh'),
    cacheOnly: formData.get('cache_only'),
  })
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input.' }
  }

  const { workspaceId, forceRefresh, cacheOnly } = parsed.data

  const member = await requireWorkspaceMember(workspaceId)
  if (!member.ok) return { ok: false, error: 'Not a member.' }

  const supabase = await createClient()

  // Pull workspace branding for niche/tone/cadence/timezone.
  const { data: ws } = await supabase
    .from('workspaces')
    .select('branding, name')
    .eq('id', workspaceId)
    .maybeSingle()
  const branding = (ws?.branding ?? {}) as Record<string, unknown>

  // Cache check — 24h TTL unless force_refresh=true.
  const cached =
    branding.plan && typeof branding.plan === 'object'
      ? (branding.plan as Record<string, unknown>)
      : null
  if (cached && forceRefresh !== 'true') {
    const generatedAt =
      typeof cached.generatedAt === 'string' ? cached.generatedAt : null
    const ageMs = generatedAt
      ? Date.now() - new Date(generatedAt).getTime()
      : Number.POSITIVE_INFINITY
    if (
      ageMs < PLAN_CACHE_TTL_MS &&
      Array.isArray(cached.slots) &&
      cached.slots.length > 0
    ) {
      return {
        ok: true,
        slots: cached.slots as PlanSlot[],
        generatedAt: generatedAt ?? undefined,
        aiUsed: cached.aiUsed === true,
        cached: true,
      }
    }
  }

  // cache_only short-circuit: the Plan tab auto-loads cached plans on
  // mount so users land on a populated screen, but we don't want to
  // silently burn AI credits if the cache is empty/expired. Return
  // an empty success and let the user click "Generate" explicitly.
  if (cacheOnly === 'true') {
    return { ok: true, slots: [], cached: false, aiUsed: false }
  }

  // Fetch approved outputs for the workspace — the plan pool. The
  // outputs table stores body as a free-text caption and metadata
  // as JSON (hook + tags live there). We pull the IDs whose latest
  // state is 'approved' via the same `output_states`-aware query
  // shape used everywhere else, but for slice A we keep it simple
  // and rely on the latest output_state row per output. Cap at 50
  // so the LLM payload stays bounded.
  const { data: outputs } = await supabase
    .from('outputs')
    .select('id, platform, body, metadata, current_state, created_at')
    .eq('workspace_id', workspaceId)
    .eq('current_state', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  const drafts: ApprovedDraftPreview[] = (outputs ?? []).map((o) => {
    const meta = (o.metadata ?? {}) as Record<string, unknown>
    const hook =
      typeof meta.hook === 'string'
        ? meta.hook
        : (o.body ?? '').toString().split('\n')[0] ?? ''
    const tags = Array.isArray(meta.hashtags)
      ? (meta.hashtags as unknown[]).filter(
          (t): t is string => typeof t === 'string',
        )
      : Array.isArray(meta.tags)
        ? (meta.tags as unknown[]).filter(
            (t): t is string => typeof t === 'string',
          )
        : []
    return {
      id: String(o.id),
      platform: o.platform as ApprovedDraftPreview['platform'],
      hook: hook.slice(0, 200),
      caption_preview:
        typeof o.body === 'string' ? o.body.slice(0, 240) : '',
      tags,
      created_at:
        typeof o.created_at === 'string' ? o.created_at : '',
    }
  })

  if (drafts.length === 0) {
    return {
      ok: false,
      error:
        'No approved drafts to plan. Approve a draft on the Board first, then come back.',
    }
  }

  // Compute "Monday of next week" in workspace timezone (best effort —
  // we use the server's clock; full per-workspace TZ comes in slice C).
  const now = new Date()
  const monday = new Date(now)
  const day = monday.getDay() // 0 = Sun
  const diff = (1 - day + 7) % 7 || 7 // Always next Monday
  monday.setDate(monday.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const result = await generatePlan({
    workspaceId,
    weekStarting: monday,
    drafts,
    brand: {
      niche:
        typeof branding.niche === 'string' ? (branding.niche as string) : null,
      tone:
        typeof branding.tone === 'string' ? (branding.tone as string) : null,
      timezone: 'UTC',
    },
  })

  if ('ok' in result && result.ok === false) {
    return { ok: false, error: result.error }
  }
  if (!('slots' in result)) {
    return { ok: false, error: 'Plan generator returned no slots.' }
  }

  // Persist on workspace.branding.plan for the cache hit on next load.
  try {
    const nextBranding = {
      ...branding,
      plan: {
        slots: result.slots,
        generatedAt: result.generatedAt,
        aiUsed: result.aiUsed,
      },
    }
    await supabase
      .from('workspaces')
      .update({ branding: nextBranding as never })
      .eq('id', workspaceId)
  } catch {
    // Cache write is non-fatal — the plan already returned.
  }

  return {
    ok: true,
    slots: result.slots,
    generatedAt: result.generatedAt,
    aiUsed: result.aiUsed,
    aiError: result.aiError,
    cached: false,
  }
}

// ---------------------------------------------------------------------------
// commitPlanSlotAction — turns one suggested slot into a real
// scheduled_posts row. Used by the Plan tab's per-slot "Schedule" button.
// ---------------------------------------------------------------------------

const commitPlanSlotSchema = z.object({
  workspaceId: z.string().uuid(),
  outputId: z.string().uuid(),
  platform: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
})

export async function commitPlanSlotAction(
  _prev: SchedulerActionState,
  formData: FormData,
): Promise<SchedulerActionState> {
  const parsed = commitPlanSlotSchema.safeParse({
    workspaceId: formData.get('workspace_id'),
    outputId: formData.get('output_id'),
    platform: formData.get('platform'),
    date: formData.get('date'),
    time: formData.get('time'),
  })
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input.' }
  }

  const { workspaceId, outputId, platform, date, time } = parsed.data
  const user = await getUser()
  if (!user) redirect('/login')

  const member = await requireWorkspaceMember(workspaceId)
  if (!member.ok) return { ok: false, error: 'Not a member.' }

  const supabase = await createClient()
  const scheduledFor = new Date(`${date}T${time}:00`)
  if (Number.isNaN(scheduledFor.getTime())) {
    return { ok: false, error: 'Bad date/time.' }
  }

  const { error } = await supabase.from('scheduled_posts').insert({
    workspace_id: workspaceId,
    output_id: outputId,
    platform,
    scheduled_for: scheduledFor.toISOString(),
    status: 'scheduled',
    created_by: user.id,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  return {
    ok: true,
    message: `Scheduled for ${scheduledFor.toLocaleString()}`,
  }
}
