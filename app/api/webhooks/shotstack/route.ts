import { NextResponse } from 'next/server'

import { updateRender } from '@/lib/video/renders/update-render'
import { verifyEnvSecret } from '@/lib/security/verify-cron-secret'

/**
 * POST /api/webhooks/shotstack
 *
 * Receives Shotstack render completion callbacks and persists the final
 * status to the `renders` table. Shotstack POSTs to this URL when a
 * render transitions to `done` or `failed`.
 *
 * Security: we verify a shared secret passed as a query param
 * (?secret=SHOTSTACK_WEBHOOK_SECRET). Falls back gracefully when the env
 * var isn't set — recommended to set it in production.
 *
 * Shotstack payload shape:
 * {
 *   type: "render",
 *   action: "complete",
 *   id: "<provider-render-id>",
 *   status: "done" | "failed",
 *   url: "https://cdn.shotstack.io/...",   // only on done
 *   error: "...",                           // only on failed
 * }
 */
export async function POST(request: Request): Promise<NextResponse> {
  // ── Secret verification ──────────────────────────────────────────────────
  // Fail closed: if SHOTSTACK_WEBHOOK_SECRET is unset, the endpoint is
  // unauthorized. Previously a missing env var let anyone POST fake
  // render-completion callbacks.
  const { searchParams } = new URL(request.url)
  const provided = searchParams.get('secret')
  if (!verifyEnvSecret('SHOTSTACK_WEBHOOK_SECRET', provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse payload ────────────────────────────────────────────────────────
  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const renderId = payload.id as string | undefined
  const status = payload.status as string | undefined

  if (!renderId || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  // Only act on terminal states — Shotstack may also send interim events
  if (status === 'done') {
    await updateRender({
      providerRenderId: renderId,
      status: 'done',
      url: (payload.url as string | undefined) ?? null,
    })
  } else if (status === 'failed') {
    await updateRender({
      providerRenderId: renderId,
      status: 'failed',
      error: (payload.error as string | undefined) ?? 'Render failed',
    })
  }

  return NextResponse.json({ received: true })
}
