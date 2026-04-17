import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret } from '@/lib/security/verify-cron-secret'
import { pingHealthcheck } from '@/lib/monitoring/ping-healthcheck'
import { log } from '@/lib/log'

/**
 * Cron endpoint — reaps content_items stuck in 'processing' for more than
 * 10 minutes. Should be called every 5 minutes via Vercel Cron or an
 * external scheduler.
 *
 * Protected by a shared CRON_SECRET environment variable.
 * Pings HEALTHCHECK_REAP_STUCK_ROWS_URL as a dead-man's switch.
 */
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!verifyCronSecret(provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hcUrl = process.env.HEALTHCHECK_REAP_STUCK_ROWS_URL
  await pingHealthcheck(hcUrl, 'start')

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago

  const { data, error } = await admin
    .from('content_items')
    .update({
      status: 'failed',
      metadata: { error: { code: 'timeout', message: 'Processing timed out after 10 minutes.' } },
    })
    .eq('status', 'processing')
    .lt('updated_at', cutoff)
    .select('id, workspace_id')

  if (error) {
    log.error('reap-stuck-rows db error', error)
    await pingHealthcheck(hcUrl, 'fail', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const reaped = data?.length ?? 0
  log.info('reap-stuck-rows done', { reaped })
  await pingHealthcheck(hcUrl, 'success', { reaped })

  return NextResponse.json({ reaped, cutoff })
}
