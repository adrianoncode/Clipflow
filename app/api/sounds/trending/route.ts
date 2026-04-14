import { NextResponse } from 'next/server'

import { getUser } from '@/lib/auth/get-user'
import { checkFeatureFlag } from '@/lib/billing/check-feature'
import { fetchTrendingSounds } from '@/lib/scrapers/tiktok-trending-sounds'

/**
 * GET /api/sounds/trending?workspace_id=xxx&region=US&limit=30
 *
 * Returns the current TikTok trending-sounds list, feature-gated on the
 * workspace plan (Team+). Cached globally for 4h so the actual Apify
 * call happens ~once per region per 4h across the whole userbase.
 */
export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  if (!workspaceId)
    return NextResponse.json(
      { error: 'Missing workspace_id' },
      { status: 400 },
    )

  const flag = await checkFeatureFlag(workspaceId, 'trendingSounds')
  if (!flag.ok) {
    return NextResponse.json(
      { error: flag.message ?? 'Trending sounds not available on your plan.' },
      { status: 403 },
    )
  }

  const region = searchParams.get('region') ?? 'US'
  const limit = Math.min(
    parseInt(searchParams.get('limit') ?? '30', 10) || 30,
    50,
  )

  const result = await fetchTrendingSounds({ region, limit })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json({ sounds: result.sounds })
}
