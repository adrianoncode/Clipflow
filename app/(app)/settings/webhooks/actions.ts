'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

const WEBHOOK_EVENTS = ['content.ready', 'output.generated', 'output.approved', 'post.published'] as const

// ── Save (create) webhook ────────────────────────────────────────────────────

const saveWebhookSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().trim().min(1, 'Name is required').max(100),
  url: z.string().url('Must be a valid URL'),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, 'Select at least one event'),
})

export type SaveWebhookState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function saveWebhookAction(
  _prev: SaveWebhookState,
  formData: FormData,
): Promise<SaveWebhookState> {
  const events = formData.getAll('events') as string[]

  const parsed = saveWebhookSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    name: formData.get('name'),
    url: formData.get('url'),
    events,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()
  const { error } = await supabase.from('webhooks').insert({
    workspace_id: parsed.data.workspace_id,
    name: parsed.data.name,
    url: parsed.data.url,
    events: parsed.data.events,
    created_by: user.id,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings/webhooks')
  return { ok: true }
}

// ── Delete webhook ────────────────────────────────────────────────────────────

const deleteWebhookSchema = z.object({
  workspace_id: z.string().uuid(),
  webhook_id: z.string().uuid(),
})

export type DeleteWebhookState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function deleteWebhookAction(
  _prev: DeleteWebhookState,
  formData: FormData,
): Promise<DeleteWebhookState> {
  const parsed = deleteWebhookSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    webhook_id: formData.get('webhook_id'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()
  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', parsed.data.webhook_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings/webhooks')
  return { ok: true }
}

// ── Test webhook ──────────────────────────────────────────────────────────────

const testWebhookSchema = z.object({
  workspace_id: z.string().uuid(),
  webhook_id: z.string().uuid(),
})

export type TestWebhookState =
  | { ok?: undefined }
  | { ok: true; status: number }
  | { ok: false; error: string }

export async function testWebhookAction(
  _prev: TestWebhookState,
  formData: FormData,
): Promise<TestWebhookState> {
  const parsed = testWebhookSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    webhook_id: formData.get('webhook_id'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()
  const { data: webhook } = await supabase
    .from('webhooks')
    .select('url')
    .eq('id', parsed.data.webhook_id)
    .eq('workspace_id', parsed.data.workspace_id)
    .maybeSingle()

  if (!webhook) return { ok: false, error: 'Webhook not found.' }

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'test',
        message: 'Clipflow webhook test',
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10_000),
    })

    // Update last status
    await supabase
      .from('webhooks')
      .update({ last_triggered_at: new Date().toISOString(), last_status: res.status })
      .eq('id', parsed.data.webhook_id)

    revalidatePath('/settings/webhooks')
    return { ok: true, status: res.status }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Request failed.' }
  }
}
