export const dynamic = 'force-dynamic'
export const metadata = { title: 'Webhooks' }

import { redirect } from 'next/navigation'
import { Webhook } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { createClient } from '@/lib/supabase/server'
import { WebhooksClient } from '@/components/settings/webhooks-client'

export default async function WebhooksPage({
  searchParams,
}: {
  searchParams: { workspace?: string }
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspaces()
  const workspaceId = searchParams.workspace ?? workspaces.find((w) => w.role === 'owner')?.id
  if (!workspaceId) redirect('/dashboard')

  const supabase = createClient()
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('id, workspace_id, name, url, events, is_active, last_triggered_at, last_status')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <Webhook className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Webhooks</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Send events to Zapier, Make.com, or any custom endpoint when things happen in Clipflow.
          </p>
        </div>
      </div>

      <WebhooksClient
        workspaceId={workspaceId}
        webhooks={webhooks ?? []}
      />
    </div>
  )
}
