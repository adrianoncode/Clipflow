import { NextResponse } from 'next/server'

import { getUser } from '@/lib/auth/get-user'
import { getRenderStatus } from '@/lib/video/shotstack-render'
import { updateRender } from '@/lib/video/renders/update-render'

/**
 * GET /api/video/render-status?id=xxx
 *
 * Polls the Shotstack render status. When the render resolves (done or
 * failed), we also upsert the `public.renders` row so the UI can pick
 * up the final URL without the client having to pass it back — the
 * renders history and the outputs page query the DB directly.
 */
export async function GET(request: Request) {
  const user = await getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const renderId = searchParams.get('id')
  if (!renderId)
    return NextResponse.json({ error: 'Missing render ID' }, { status: 400 })

  const status = await getRenderStatus(renderId)

  // Persist terminal states back to the DB — no-op while still rendering.
  if (status.status === 'done') {
    await updateRender({
      providerRenderId: renderId,
      status: 'done',
      url: status.url ?? null,
    })
  } else if (status.status === 'failed') {
    await updateRender({
      providerRenderId: renderId,
      status: 'failed',
      error: status.error ?? null,
    })
  }

  return NextResponse.json(status)
}
