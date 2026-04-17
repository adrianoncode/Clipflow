import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { notifyPostPublished } from '@/lib/notifications/triggers'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/crypto/encryption'
import { triggerWebhooks } from '@/lib/webhooks/trigger-webhook'

export const dynamic = 'force-dynamic'

const UPLOAD_POST_API = 'https://upload-post.com/api/v1'

/**
 * POST /api/cron/publish-scheduled
 *
 * Publishes due posts via Upload-Post BYOK. Each post is processed with
 * optimistic locking: status is set to 'publishing' first, then the
 * Upload-Post API is called. If the API succeeds but the DB update fails,
 * we retry the DB update once before marking as failed — preventing
 * duplicate publishes on the next cron run.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Find posts due for publishing (scheduled_for <= now, status = 'scheduled')
  const now = new Date().toISOString()
  const { data: duePosts } = await supabase
    .from('scheduled_posts')
    .select('id, platform, output_id, workspace_id')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .limit(10)

  if (!duePosts?.length) {
    return NextResponse.json({ ok: true, published: 0 })
  }

  // Fetch output bodies + content titles for due posts
  const outputIds = [...new Set(duePosts.map((p) => p.output_id))]
  const { data: outputs } = await supabase
    .from('outputs')
    .select('id, body, content_id, content_items(title)')
    .in('id', outputIds)

  const outputMap = new Map<string, { body: string; title: string }>()
  for (const o of outputs ?? []) {
    const ci = o.content_items as unknown as { title: string | null } | null
    outputMap.set(o.id, {
      body: o.body ?? '',
      title: ci?.title ?? 'Scheduled post',
    })
  }

  // Cache decrypted Upload-Post keys per workspace
  const keyCache = new Map<string, string | null>()
  async function getUploadPostKey(workspaceId: string): Promise<string | null> {
    if (keyCache.has(workspaceId)) return keyCache.get(workspaceId)!
    const { data } = await supabase
      .from('ai_keys')
      .select('ciphertext, iv, auth_tag')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'upload-post')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data) { keyCache.set(workspaceId, null); return null }
    try {
      const plain = decrypt({ ciphertext: data.ciphertext, iv: data.iv, authTag: data.auth_tag })
      keyCache.set(workspaceId, plain)
      return plain
    } catch {
      keyCache.set(workspaceId, null)
      return null
    }
  }

  const results: Array<{ id: string; platform: string; ok: boolean; error?: string }> = []

  for (const post of duePosts) {
    // Mark as publishing (optimistic lock — prevents duplicate processing)
    const { error: lockError } = await supabase
      .from('scheduled_posts')
      .update({ status: 'publishing' })
      .eq('id', post.id)
      .eq('status', 'scheduled') // only if still scheduled

    if (lockError) {
      results.push({ id: post.id, platform: post.platform, ok: false, error: 'Lock failed' })
      continue
    }

    const apiKey = await getUploadPostKey(post.workspace_id)
    if (!apiKey) {
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed', error_message: 'Upload-Post not connected. Add it in Settings → AI Connections.' })
        .eq('id', post.id)
      results.push({ id: post.id, platform: post.platform, ok: false, error: 'No Upload-Post key' })
      continue
    }

    const outputData = outputMap.get(post.output_id) ?? { body: '', title: 'Scheduled post' }

    // Call Upload-Post API
    let publishOk = false
    let platformPostId: string | undefined
    let publishError: string | undefined

    try {
      const response = await fetch(`${UPLOAD_POST_API}/post`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platforms: [post.platform],
          description: outputData.body,
          title: outputData.title,
          tags: [],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const posts = (data?.posts ?? {}) as Record<string, { id?: string }>
        platformPostId = posts[post.platform]?.id
        publishOk = true
      } else {
        let detail = ''
        try { const b = await response.json(); detail = b?.message ?? b?.error ?? '' } catch {}
        publishError = detail || `Upload-Post returned ${response.status}`
      }
    } catch (err) {
      publishError = err instanceof Error ? err.message : 'Network error'
    }

    if (publishOk) {
      // Update to published — retry once on failure to prevent duplicate publishes
      const updateData = {
        status: 'published' as const,
        published_at: new Date().toISOString(),
        platform_post_id: platformPostId ?? null,
      }
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update(updateData)
        .eq('id', post.id)

      if (updateError) {
        // Retry once
        const { error: retryError } = await supabase
          .from('scheduled_posts')
          .update(updateData)
          .eq('id', post.id)
        if (retryError) {
          // eslint-disable-next-line no-console
          console.error(`[publish-cron] DB update failed after publish for post ${post.id}:`, retryError.message)
        }
      }

      // Fire-and-forget webhook
      triggerWebhooks(post.workspace_id, 'post.published', {
        scheduled_post_id: post.id,
        output_id: post.output_id,
        platform: post.platform,
        platform_post_id: platformPostId,
      })

      // Fire-and-forget notification
      try {
        void (async () => {
          try {
            const { data: ws } = await supabase
              .from('workspaces')
              .select('owner_id')
              .eq('id', post.workspace_id)
              .maybeSingle()
            if (!ws?.owner_id) return
            notifyPostPublished({
              userId: ws.owner_id,
              workspaceId: post.workspace_id,
              platform: post.platform,
              contentTitle: outputData.title,
            })
          } catch {}
        })()
      } catch {}

      results.push({ id: post.id, platform: post.platform, ok: true })
    } else {
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed', error_message: publishError ?? 'Unknown error' })
        .eq('id', post.id)

      results.push({ id: post.id, platform: post.platform, ok: false, error: publishError })
    }
  }

  // Revalidate schedule pages for all affected workspaces
  const affectedWorkspaces = new Set(duePosts.map((p) => p.workspace_id))
  for (const wsId of affectedWorkspaces) {
    revalidatePath(`/workspace/${wsId}/schedule`)
  }

  return NextResponse.json({
    ok: true,
    published: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  })
}
