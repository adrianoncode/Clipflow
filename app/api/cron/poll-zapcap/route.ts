import { NextResponse } from 'next/server'

import { getZapcapSecretsAsAdmin } from '@/lib/captions/get-zapcap-secrets'
import { getTask, mapZapCapStatus } from '@/lib/captions/zapcap-client'
import { verifyCronSecret } from '@/lib/security/verify-cron-secret'
import { pingHealthcheck } from '@/lib/monitoring/ping-healthcheck'
import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'

/**
 * Polling fallback for ZapCap caption renders that never received a
 * webhook callback. Webhooks normally fire reliably (ZapCap retries
 * 5×), but local-dev tunnels go down, secrets get rotated mid-flight,
 * and the occasional production outage drops a callback. This cron
 * sweeps any row stuck in `queued` / `processing` for more than 5
 * minutes and reconciles its status against `GET /videos/{vid}/task/{tid}`.
 *
 * Schedule (vercel.json): every 10 minutes is plenty — webhooks
 * handle the happy path, this is just a safety net.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const STUCK_AFTER_MS = 5 * 60 * 1000 // 5 minutes
const BATCH_LIMIT = 50

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!verifyCronSecret(provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hcUrl = process.env.HEALTHCHECK_POLL_ZAPCAP_URL
  await pingHealthcheck(hcUrl, 'start')

  const admin = createAdminClient()

  const cutoffIso = new Date(Date.now() - STUCK_AFTER_MS).toISOString()

  const { data: stuck, error: queryError } = await admin
    .from('caption_renders')
    .select('id, workspace_id, zapcap_video_id, zapcap_task_id, status')
    .in('status', ['queued', 'processing'])
    .lt('updated_at', cutoffIso)
    .limit(BATCH_LIMIT)

  if (queryError) {
    log.error('poll-zapcap query failed', queryError)
    await pingHealthcheck(hcUrl, 'fail')
    return NextResponse.json({ error: queryError.message }, { status: 500 })
  }

  const rows = stuck ?? []
  if (rows.length === 0) {
    await pingHealthcheck(hcUrl, 'success')
    return NextResponse.json({ ok: true, checked: 0 })
  }

  let updated = 0
  let unchanged = 0

  // Cache decrypted secrets per workspace so a batch of stuck rows
  // for the same workspace doesn't re-decrypt N times.
  const secretsCache = new Map<
    string,
    { apiKey: string; webhookSecret: string } | null
  >()

  for (const row of rows) {
    const wsId = row.workspace_id as string

    let secrets = secretsCache.get(wsId)
    if (secrets === undefined) {
      const result = await getZapcapSecretsAsAdmin(wsId)
      secrets = result.ok ? result.secrets : null
      secretsCache.set(wsId, secrets)
    }

    if (!secrets) {
      // Workspace lost its key — flip the row to failed so the UI
      // stops spinning forever.
      await admin
        .from('caption_renders')
        .update({
          status: 'failed',
          error: 'ZapCap key missing or unreadable.',
        })
        .eq('id', row.id)
      updated += 1
      continue
    }

    const probe = await getTask({
      apiKey: secrets.apiKey,
      videoId: row.zapcap_video_id as string,
      taskId: row.zapcap_task_id as string,
    })
    if (!probe.ok) {
      // Network / auth error — leave the row alone, try again on
      // the next sweep. Don't lock the user out by flipping to
      // failed on a transient blip.
      unchanged += 1
      continue
    }

    const remoteStatus = probe.task.status
    const localStatus = mapZapCapStatus(remoteStatus)

    if (localStatus === 'ready' && probe.task.downloadUrl) {
      await admin
        .from('caption_renders')
        .update({
          status: 'ready',
          output_url: probe.task.downloadUrl,
          error: null,
        })
        .eq('id', row.id)
      updated += 1
    } else if (localStatus === 'failed') {
      await admin
        .from('caption_renders')
        .update({
          status: 'failed',
          error: probe.task.error ?? 'ZapCap render failed.',
        })
        .eq('id', row.id)
      updated += 1
    } else if (localStatus !== row.status) {
      await admin
        .from('caption_renders')
        .update({ status: localStatus })
        .eq('id', row.id)
      updated += 1
    } else {
      unchanged += 1
    }
  }

  await pingHealthcheck(hcUrl, 'success')

  return NextResponse.json({
    ok: true,
    checked: rows.length,
    updated,
    unchanged,
  })
}
