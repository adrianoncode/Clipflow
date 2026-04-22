import { NextResponse } from 'next/server'

import { updateRender } from '@/lib/video/renders/update-render'
import { updateHighlightRender } from '@/lib/highlights/update-highlight-render'
import { verifyEnvSecret } from '@/lib/security/verify-cron-secret'
import { log } from '@/lib/log'

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
  // Prefer the x-webhook-secret header so the secret never leaks into
  // access logs, Sentry breadcrumbs, or browser history. The legacy
  // ?secret=… query param is still accepted so in-flight renders
  // triggered before this change don't start failing, but new renders
  // should use the header — see callbackUrl builder in
  // lib/video/shotstack-render.ts.
  //
  // Fails closed when SHOTSTACK_WEBHOOK_SECRET is unset.
  const headerSecret = request.headers.get('x-webhook-secret')
  const { searchParams } = new URL(request.url)
  const querySecret = searchParams.get('secret')
  const provided = headerSecret ?? querySecret
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
    log.warn('shotstack webhook missing id or status', {
      hasId: Boolean(renderId),
      hasStatus: Boolean(status),
    })
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  // Log every terminal event — priceless when a render silently
  // stays stuck in 'rendering' because the callback never arrived.
  if (status === 'done' || status === 'failed') {
    log.info('shotstack webhook received', {
      renderId,
      status,
      hasUrl: Boolean(payload.url),
      hasError: Boolean(payload.error),
    })
  }

  // Only act on terminal states — Shotstack may also send interim events.
  //
  // Both `renders` and `content_highlights` are updated in parallel:
  // any given render_id lives in exactly one of those tables, and the
  // non-matching update is a cheap no-op. Running them both keeps the
  // webhook a single dispatch point instead of spreading the logic
  // across handlers.
  if (status === 'done') {
    const url = (payload.url as string | undefined) ?? null
    // Poster comes back on the same callback when we asked for one in
    // the render body. Shotstack returns it as response.poster or as
    // a top-level `poster` — we read both to be safe across versions.
    const poster =
      (payload.poster as string | undefined) ??
      ((payload as { response?: { poster?: unknown } }).response?.poster as
        | string
        | undefined) ??
      null
    await Promise.all([
      updateRender({ providerRenderId: renderId, status: 'done', url }),
      updateHighlightRender({ renderId, status: 'ready', url, thumbnailUrl: poster }),
    ])
  } else if (status === 'failed') {
    const error = (payload.error as string | undefined) ?? 'Render failed'
    await Promise.all([
      updateRender({ providerRenderId: renderId, status: 'failed', error }),
      updateHighlightRender({ renderId, status: 'failed', error }),
    ])
  }

  return NextResponse.json({ received: true })
}
