'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { getZapcapSecrets } from '@/lib/captions/get-zapcap-secrets'
import {
  createCaptioningTask,
  listTemplates,
  uploadVideoByUrl,
  type ZapCapTemplate,
} from '@/lib/captions/zapcap-client'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

// ---------------------------------------------------------------------------
// List templates from the user's ZapCap account
// ---------------------------------------------------------------------------

const listTemplatesSchema = z.object({
  workspace_id: z.string().uuid(),
})

export type ListZapcapTemplatesState =
  | { ok?: undefined; error?: string }
  | { ok: true; templates: ZapCapTemplate[] }
  | { ok: false; error: string; code?: 'no_key' | 'forbidden' | 'unknown' }

/**
 * Pulls the user's available ZapCap templates so the UI can render
 * the style picker. Result is short-lived — re-fetch on every picker
 * open rather than caching, since accounts add/remove templates.
 */
export async function listZapcapTemplatesAction(
  _prev: ListZapcapTemplatesState,
  formData: FormData,
): Promise<ListZapcapTemplatesState> {
  const parsed = listTemplatesSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
  })
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const { workspace_id } = parsed.data
  const check = await requireWorkspaceMember(workspace_id)
  if (!check.ok) return { ok: false, error: check.message }

  const secrets = await getZapcapSecrets(workspace_id)
  if (!secrets.ok) {
    return {
      ok: false,
      error: secrets.message,
      code: secrets.code === 'forbidden' ? 'forbidden' : 'no_key',
    }
  }

  const result = await listTemplates({ apiKey: secrets.secrets.apiKey })
  if (!result.ok) {
    return { ok: false, error: result.error, code: 'unknown' }
  }
  return { ok: true, templates: result.templates }
}

// ---------------------------------------------------------------------------
// Render captions for a single highlight
// ---------------------------------------------------------------------------

const renderCaptionsSchema = z.object({
  workspace_id: z.string().uuid(),
  highlight_id: z.string().uuid(),
  template_id: z.string().min(8).max(120),
})

export type RenderCaptionsState =
  | { ok?: undefined; error?: string }
  | { ok: true; renderId: string; status: 'queued' | 'processing' | 'ready' }
  | {
      ok: false
      error: string
      code?:
        | 'no_key'
        | 'no_video'
        | 'forbidden'
        | 'rate_limit'
        | 'in_progress'
        | 'unknown'
    }

/**
 * Submits a ZapCap render job for a finished Shotstack highlight.
 *
 * Preconditions:
 *   - Highlight has `status='ready'` and a `video_url` (the
 *     Shotstack output URL — ZapCap pulls from it directly via
 *     /videos/url, no re-upload through our server).
 *   - Workspace has a `zapcap` row in `ai_keys` (apiKey +
 *     webhookSecret).
 *   - Caller is editor / owner.
 *
 * Idempotency: `caption_renders` has `unique (highlight_id, template_id)`.
 * Re-running the same combo while the previous render is in-flight
 * returns `code='in_progress'` instead of double-charging the user's
 * ZapCap credits. After a finished or failed render, the action
 * deletes the old row and submits a fresh task.
 */
export async function renderCaptionsAction(
  _prev: RenderCaptionsState,
  formData: FormData,
): Promise<RenderCaptionsState> {
  const parsed = renderCaptionsSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    highlight_id: formData.get('highlight_id'),
    template_id: formData.get('template_id'),
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid request.',
    }
  }

  const { workspace_id, highlight_id, template_id } = parsed.data

  const check = await requireWorkspaceMember(workspace_id)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return {
      ok: false,
      error: 'Only editors and owners can render captioned variants.',
    }
  }

  // Cap to the same generation budget as other AI features. ZapCap
  // bills per minute rendered, so this is more about preventing
  // browser-script abuse than wallet protection.
  const rl = await checkRateLimit(
    `captions:zapcap:${check.userId}`,
    RATE_LIMITS.generation.limit,
    RATE_LIMITS.generation.windowMs,
  )
  if (!rl.ok) {
    return {
      ok: false,
      error: 'Too many caption renders too fast. Wait a minute and try again.',
      code: 'rate_limit',
    }
  }

  const supabase = createClient()
  const { data: highlight } = await supabase
    .from('content_highlights')
    .select('id, content_id, workspace_id, status, video_url')
    .eq('id', highlight_id)
    .eq('workspace_id', workspace_id)
    .maybeSingle()

  if (!highlight) return { ok: false, error: 'Highlight not found.' }
  if (highlight.status !== 'ready' || !highlight.video_url) {
    return {
      ok: false,
      error:
        'This highlight has not finished rendering yet — wait for the base render before adding captions.',
      code: 'no_video',
    }
  }

  // Reject re-runs while a previous job for the same (highlight,
  // template) is mid-flight. Done jobs (ready / failed) are replaced.
  const { data: existing } = await supabase
    .from('caption_renders')
    .select('id, status')
    .eq('highlight_id', highlight_id)
    .eq('template_id', template_id)
    .maybeSingle()

  if (existing && (existing.status === 'queued' || existing.status === 'processing')) {
    return {
      ok: false,
      error: 'A caption render is already in progress for this style.',
      code: 'in_progress',
    }
  }

  const secrets = await getZapcapSecrets(workspace_id)
  if (!secrets.ok) {
    return {
      ok: false,
      error: secrets.message,
      code: secrets.code === 'forbidden' ? 'forbidden' : 'no_key',
    }
  }

  // 1. Tell ZapCap to pull the Shotstack output by URL.
  const upload = await uploadVideoByUrl({
    apiKey: secrets.secrets.apiKey,
    videoUrl: highlight.video_url as string,
  })
  if (!upload.ok) {
    return { ok: false, error: upload.error, code: 'unknown' }
  }

  // 2. Submit the render task with our webhook URL. ZapCap calls back
  //    when the render finishes — we don't poll under normal flow.
  const webhookUrl = buildWebhookUrl()
  const task = await createCaptioningTask({
    apiKey: secrets.secrets.apiKey,
    videoId: upload.videoId,
    templateId: template_id,
    webhookUrl,
  })
  if (!task.ok) {
    return { ok: false, error: task.error, code: 'unknown' }
  }

  // 3. Persist the render row. Use admin client so the upsert isn't
  //    blocked by per-row RLS — workspace membership was enforced at
  //    the top of the action.
  const admin = createAdminClient()

  if (existing) {
    // Old finished/failed row → replace via direct delete (cascade
    // doesn't apply here, just one row). This keeps the unique
    // constraint clean.
    await admin.from('caption_renders').delete().eq('id', existing.id)
  }

  const { data: inserted, error: insertError } = await admin
    .from('caption_renders')
    .insert({
      highlight_id,
      workspace_id,
      template_id,
      zapcap_video_id: upload.videoId,
      zapcap_task_id: task.taskId,
      status: 'queued',
    })
    .select('id, status')
    .single()

  if (insertError || !inserted) {
    log.error('renderCaptionsAction insert failed', insertError)
    return { ok: false, error: 'Could not save the render record.' }
  }

  revalidatePath(
    `/workspace/${workspace_id}/content/${highlight.content_id}/highlights`,
  )

  return {
    ok: true,
    renderId: inserted.id as string,
    status: inserted.status as 'queued' | 'processing' | 'ready',
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the public webhook URL for ZapCap callbacks. Order:
 *   1. `ZAPCAP_WEBHOOK_URL` (full override — useful for ngrok/dev).
 *   2. `NEXT_PUBLIC_APP_URL` + `/api/webhooks/zapcap`.
 *   3. Fallback to clipflow.to (production).
 */
function buildWebhookUrl(): string {
  const direct = process.env.ZAPCAP_WEBHOOK_URL
  if (direct) return direct.replace(/\/$/, '')

  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://clipflow.to'
  return `${base.replace(/\/$/, '')}/api/webhooks/zapcap`
}
