import { NextResponse } from 'next/server'

import { getUser } from '@/lib/auth/get-user'
import { getRenderStatus } from '@/lib/video/shotstack-render'

/**
 * GET /api/video/render-status?id=xxx
 * Polls the Shotstack render status.
 */
export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const renderId = searchParams.get('id')
  if (!renderId) return NextResponse.json({ error: 'Missing render ID' }, { status: 400 })

  const status = await getRenderStatus(renderId)
  return NextResponse.json(status)
}
