import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Cron endpoint — reaps content_items stuck in 'processing' for more than
 * 10 minutes. Should be called every 5 minutes via Vercel Cron or an
 * external scheduler.
 *
 * Protected by a shared CRON_SECRET environment variable.
 */
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

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
    console.error('[reap-stuck-rows] DB error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const reaped = data?.length ?? 0
  console.log(`[reap-stuck-rows] reaped ${reaped} stuck rows`)

  return NextResponse.json({ reaped, cutoff })
}
