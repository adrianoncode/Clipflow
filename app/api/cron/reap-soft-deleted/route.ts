import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret } from '@/lib/security/verify-cron-secret'

/**
 * Cron endpoint — hard-deletes content_items + outputs rows that have
 * been soft-deleted for more than 30 days.
 *
 * Users can undo a delete within the 30-day window via support. After
 * that the row is permanently purged (CASCADE takes out related rows
 * like output_states, scheduled_posts, etc.).
 *
 * Schedule via Vercel Cron: daily at 03:00 UTC.
 * Protected by CRON_SECRET (fail-closed).
 */
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null
  const xHeader = req.headers.get('x-cron-secret')
  const provided = bearer ?? xHeader
  if (!verifyCronSecret(provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Delete outputs first (FK order doesn't matter since both have
  // CASCADE set against their parents, but outputs's CASCADE reaches
  // further: scheduled_posts, renders, output_states).
  const { data: deletedOutputs, error: outputsError } = await admin
    .from('outputs')
    .delete()
    .lt('deleted_at', cutoff)
    .select('id')

  if (outputsError) {
    // eslint-disable-next-line no-console
    console.error('[reap-soft-deleted] outputs error:', outputsError.message)
    return NextResponse.json({ error: outputsError.message }, { status: 500 })
  }

  const { data: deletedContent, error: contentError } = await admin
    .from('content_items')
    .delete()
    .lt('deleted_at', cutoff)
    .select('id')

  if (contentError) {
    // eslint-disable-next-line no-console
    console.error('[reap-soft-deleted] content_items error:', contentError.message)
    return NextResponse.json({ error: contentError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    outputsReaped: deletedOutputs?.length ?? 0,
    contentItemsReaped: deletedContent?.length ?? 0,
    cutoff,
  })
}
