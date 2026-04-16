import { NextRequest, NextResponse } from 'next/server'

import { notifyPostPublished } from '@/lib/notifications/triggers'
import { createAdminClient } from '@/lib/supabase/admin'
import { publishPost } from '@/lib/scheduler/publish-post'
import { triggerWebhooks } from '@/lib/webhooks/trigger-webhook'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Find posts due for publishing (scheduled_for <= now, status = 'scheduled')
  const now = new Date().toISOString()
  const { data: duePosts } = await supabase
    .from('scheduled_posts')
    .select('id, platform, output_id, social_account_id, workspace_id')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .limit(10)

  if (!duePosts?.length) {
    return NextResponse.json({ ok: true, published: 0 })
  }

  // Fetch output bodies for due posts
  const outputIds = [...new Set(duePosts.map((p) => p.output_id))]
  const { data: outputs } = await supabase
    .from('outputs')
    .select('id, body')
    .in('id', outputIds)

  const outputBodyMap = new Map<string, string>()
  for (const o of outputs ?? []) outputBodyMap.set(o.id, o.body ?? '')

  const results = []
  for (const post of duePosts) {
    // Mark as publishing
    await supabase
      .from('scheduled_posts')
      .update({ status: 'publishing' })
      .eq('id', post.id)

    // Get access token
    let accessToken = ''
    if (post.social_account_id) {
      const { data: account } = await supabase
        .from('social_accounts')
        .select('access_token')
        .eq('id', post.social_account_id)
        .maybeSingle()
      accessToken = account?.access_token ?? ''
    }

    const content = outputBodyMap.get(post.output_id) ?? ''
    const result = await publishPost(post.platform, accessToken, content)

    if (result.ok) {
      await supabase
        .from('scheduled_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          platform_post_id: result.platformPostId,
        })
        .eq('id', post.id)

      // Fire-and-forget webhook for post.published
      triggerWebhooks(post.workspace_id, 'post.published', {
        scheduled_post_id: post.id,
        output_id: post.output_id,
        platform: post.platform,
        platform_post_id: result.platformPostId,
      })

      // Fire-and-forget notification — resolve workspace owner + content title
      try {
        void (async () => {
          try {
            const { data: ws } = await supabase
              .from('workspaces')
              .select('owner_id')
              .eq('id', post.workspace_id)
              .maybeSingle()
            if (!ws?.owner_id) return
            const body = outputBodyMap.get(post.output_id) ?? ''
            notifyPostPublished({
              userId: ws.owner_id,
              workspaceId: post.workspace_id,
              platform: post.platform,
              contentTitle: body.slice(0, 60) || 'Scheduled post',
            })
          } catch {}
        })()
      } catch {}
    } else {
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed', error_message: result.error })
        .eq('id', post.id)
    }

    results.push({ id: post.id, platform: post.platform, ok: result.ok })
  }

  return NextResponse.json({
    ok: true,
    published: results.filter((r) => r.ok).length,
    results,
  })
}
