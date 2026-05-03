import { NextResponse } from 'next/server'

import { getZapcapSecretsAsAdmin } from '@/lib/captions/get-zapcap-secrets'
import {
  verifyWebhookSignature,
  type ZapCapWebhookPayload,
} from '@/lib/captions/zapcap-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { wakeRunsWaitingOn } from '@/lib/agent/state'
import { log } from '@/lib/log'

/**
 * ZapCap webhook receiver.
 *
 * Per the ZapCap docs we MUST respond with 200 within 300 ms or
 * they retry up to 5 times. We therefore do the absolute minimum
 * inline:
 *
 *   1. Read raw body (needed for HMAC).
 *   2. Parse JSON body and extract taskId.
 *   3. Look up the matching `caption_renders` row → workspace_id.
 *   4. Decrypt that workspace's webhook secret.
 *   5. HMAC-verify the signature against the raw body.
 *   6. Update the row (status / output_url / error).
 *   7. Return 200.
 *
 * Heavy work (mirroring the MP4 to Supabase Storage) is intentionally
 * NOT done inline — for MVP we point the player at ZapCap's CDN URL
 * directly, and a follow-up will move it onto our storage as a
 * background job triggered from this row update.
 */
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // 1. Capture the literal body bytes — JSON.stringify(parsed) would
  //    re-serialize and break the signature.
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Bad body' }, { status: 400 })
  }

  // 2. Parse for routing fields. We do NOT trust anything until
  //    HMAC verification below.
  let payload: ZapCapWebhookPayload
  try {
    payload = JSON.parse(rawBody) as ZapCapWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  if (!payload.taskId || typeof payload.taskId !== 'string') {
    return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 3. Match to our row by ZapCap's task id. This is the join key.
  const { data: row, error: lookupError } = await admin
    .from('caption_renders')
    .select('id, workspace_id, status')
    .eq('zapcap_task_id', payload.taskId)
    .maybeSingle()

  if (lookupError) {
    log.error('zapcap webhook lookup failed', lookupError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
  if (!row) {
    // Unknown task — not ours, or already cleaned up. Return 200
    // anyway so ZapCap stops retrying. Logging-only.
    log.warn('zapcap webhook for unknown task', { taskId: payload.taskId })
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 })
  }

  // 4. Pull this workspace's webhook secret.
  const secrets = await getZapcapSecretsAsAdmin(row.workspace_id as string)
  if (!secrets.ok) {
    log.error('zapcap webhook secret unavailable', {
      workspaceId: row.workspace_id,
      code: secrets.code,
    })
    // Return 200 to stop retries — operator must reconnect the key.
    return NextResponse.json(
      { ok: true, error: 'No secret on file' },
      { status: 200 },
    )
  }

  // 5. HMAC-verify. Reject without leaking which side failed.
  const sig = req.headers.get('x-signature')
  const valid = verifyWebhookSignature({
    rawBody,
    signatureHeader: sig,
    webhookSecret: secrets.secrets.webhookSecret,
  })
  if (!valid) {
    log.warn('zapcap webhook signature mismatch', {
      taskId: payload.taskId,
      workspaceId: row.workspace_id,
    })
    return NextResponse.json({ error: 'Bad signature' }, { status: 401 })
  }

  // 6. Apply the update. Only react to render-completion events;
  //    transcript and renderProgress events are interesting for
  //    progress UIs but not state-changing for the lifecycle row.
  if (payload.notificationFor === 'render') {
    const isComplete =
      payload.event === 'completed' &&
      typeof payload.renderUrl === 'string' &&
      payload.renderUrl.length > 0

    const isFailed = payload.event === 'failed'

    if (isComplete) {
      const { error: updateError } = await admin
        .from('caption_renders')
        .update({
          status: 'ready',
          output_url: payload.renderUrl as string,
          error: null,
        })
        .eq('id', row.id)
      if (updateError) {
        log.error('zapcap webhook update failed', updateError)
        // Still 200 — retry won't help once we have the URL.
      }
      try {
        await wakeRunsWaitingOn({
          kind: 'render_complete',
          id: row.id as string,
        })
      } catch (err) {
        log.warn('zapcap webhook wake-runs failed', {
          captionRenderId: row.id,
          err: err instanceof Error ? err.message : String(err),
        })
      }
    } else if (isFailed) {
      await admin
        .from('caption_renders')
        .update({
          status: 'failed',
          error: 'ZapCap render failed.',
        })
        .eq('id', row.id)
      try {
        await wakeRunsWaitingOn({
          kind: 'render_complete',
          id: row.id as string,
        })
      } catch (err) {
        log.warn('zapcap webhook wake-runs (failed branch) failed', {
          captionRenderId: row.id,
          err: err instanceof Error ? err.message : String(err),
        })
      }
    }
  } else if (payload.notificationFor === 'renderProgress') {
    // Bump the row's updated_at so the polling fallback knows the
    // job is alive. No status change.
    if (row.status === 'queued') {
      await admin
        .from('caption_renders')
        .update({ status: 'processing' })
        .eq('id', row.id)
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
