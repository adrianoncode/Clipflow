import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPublicUrl } from '@/lib/security/is-public-url'

export type WebhookEvent =
  | 'content.ready'
  | 'output.generated'
  | 'output.approved'
  | 'post.published'

export async function triggerWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
) {
  try {
    const supabase = createAdminClient()
    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('id, url, events')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .contains('events', [event])

    if (!webhooks?.length) return

    await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const body = JSON.stringify({
          event,
          workspace_id: workspaceId,
          timestamp: new Date().toISOString(),
          data: payload,
        })

        try {
          // SSRF guard — user-defined webhook URLs must not target private
          // or internal hosts. Mark the attempt as failed in that case so
          // the UI shows it's misconfigured.
          const check = await isPublicUrl(webhook.url)
          if (!check.ok) {
            await supabase
              .from('webhooks')
              .update({ last_triggered_at: new Date().toISOString(), last_status: 0 })
              .eq('id', webhook.id)
            return
          }
          const res = await fetch(check.url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            signal: AbortSignal.timeout(10_000),
            redirect: 'manual',
          })
          await supabase
            .from('webhooks')
            .update({ last_triggered_at: new Date().toISOString(), last_status: res.status })
            .eq('id', webhook.id)
        } catch {
          await supabase
            .from('webhooks')
            .update({ last_triggered_at: new Date().toISOString(), last_status: 0 })
            .eq('id', webhook.id)
        }
      })
    )
  } catch {
    // webhooks are non-critical
  }
}
