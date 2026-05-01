import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'

import { verifyExtensionToken } from '@/lib/extension-tokens'
import { checkRateLimit, extractClientIp, RATE_LIMITS } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

// Strict input schema. URL must be http(s) — no `javascript:`, `data:`, or
// `file:` schemes (those would render to dashboards as XSS-vector links
// later). Title is bounded to keep the row small.
const SaveUrlSchema = z.object({
  url: z
    .string()
    .url()
    .max(2048)
    .refine(
      (u) => {
        try {
          const parsed = new URL(u)
          return parsed.protocol === 'http:' || parsed.protocol === 'https:'
        } catch {
          return false
        }
      },
      { message: 'Only http(s) URLs are allowed' },
    ),
  title: z.string().max(500).optional(),
  workspaceId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  // 1. IP rate limit BEFORE we touch Supabase auth — without this, an
  // attacker can flood arbitrary Bearer tokens at this endpoint and burn
  // through Supabase Auth's quota even when none of them are valid.
  const ip = extractClientIp(headers())
  const ipLimit = await checkRateLimit(`save-url:ip:${ip}`, 30, 60_000)
  if (!ipLimit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429 },
    )
  }

  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = SaveUrlSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 },
    )
  }
  const { url, title, workspaceId } = parsed.data

  const plaintext = auth.replace('Bearer ', '').trim()
  const verified = await verifyExtensionToken(plaintext)
  if (!verified.ok) {
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
  }
  const userId = verified.userId

  // 2. Per-user content-create rate limit AFTER token verification.
  // Without this, a single compromised token could create unlimited
  // content_items rows.
  const userLimit = await checkRateLimit(
    `save-url:user:${userId}`,
    RATE_LIMITS.contentCreate.limit,
    RATE_LIMITS.contentCreate.windowMs,
  )
  if (!userLimit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests for this user' },
      { status: 429 },
    )
  }

  const supabase = createAdminClient()

  // Membership check + role gate. Read-only roles (viewer/client) can't
  // seed content into the workspace from the extension — only owner /
  // editor / reviewer.
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (!member) {
    return NextResponse.json({ ok: false, error: 'Not a workspace member' }, { status: 403 })
  }
  if (!['owner', 'editor', 'reviewer'].includes(member.role)) {
    return NextResponse.json(
      { ok: false, error: 'This role cannot save content' },
      { status: 403 },
    )
  }

  const { data: item, error } = await supabase
    .from('content_items')
    .insert({
      workspace_id: workspaceId,
      kind: 'url',
      status: 'processing',
      title: title || url,
      source_url: url,
      created_by: userId,
    })
    .select('id')
    .single()

  if (error || !item) {
    return NextResponse.json({ ok: false, error: 'Failed to create content item' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, contentId: item.id })
}
