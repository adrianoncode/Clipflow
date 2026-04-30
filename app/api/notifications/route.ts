import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { getUnreadNotifications } from '@/lib/notifications/get-notifications'

const MarkReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
})

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get('workspace_id') ?? undefined
  const notifications = await getUnreadNotifications(user.id, workspaceId)
  return NextResponse.json(notifications)
}

export async function POST(req: NextRequest) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = MarkReadSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 },
    )
  }
  const { ids } = parsed.data

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Per-user rate limit. Without this, a compromised session could
  // hammer this endpoint to write-amplify against the notifications
  // table; bound at the standard API limit.
  const limit = await checkRateLimit(
    `notifications:mark-read:${user.id}`,
    RATE_LIMITS.api.limit,
    RATE_LIMITS.api.windowMs,
  )
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .in('id', ids)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
