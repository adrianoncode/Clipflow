import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Cloud,
  FileText,
  Mail,
  MessageSquare,
  Table2,
  Globe,
  Webhook,
  Video,
} from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { ConnectDialog } from '@/components/integrations/connect-dialog'

export const metadata = { title: 'Integrations' }
export const dynamic = 'force-dynamic'

const WORKSPACE_COOKIE = 'clipflow.current_workspace'

type ConnectionType = 'webhook' | 'api_key' | 'oauth' | 'coming_soon' | 'managed'

interface IntegrationSpec {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: string
  connectionType: ConnectionType
  color: string
  bg: string
}

const INTEGRATIONS: IntegrationSpec[] = [
  // ── Notifications ──────────────────────────────────────────────
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notified in Slack when a render finishes or output is ready.',
    icon: MessageSquare,
    category: 'Notifications',
    connectionType: 'webhook',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Post updates to your Discord server via webhook.',
    icon: MessageSquare,
    category: 'Notifications',
    connectionType: 'webhook',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },

  // ── Export / Publish ───────────────────────────────────────────
  {
    id: 'beehiiv',
    name: 'Beehiiv',
    description: 'Push newsletter content directly to your Beehiiv publication.',
    icon: Mail,
    category: 'Export',
    connectionType: 'api_key',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Publish blog posts and SEO content directly to your WordPress site.',
    icon: Globe,
    category: 'Export',
    connectionType: 'api_key',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Publish articles to Medium with one click after generation.',
    icon: FileText,
    category: 'Export',
    connectionType: 'api_key',
    color: 'text-zinc-700',
    bg: 'bg-zinc-100',
  },

  // ── Import ─────────────────────────────────────────────────────
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Import source videos and documents directly from Drive.',
    icon: Cloud,
    category: 'Import',
    connectionType: 'oauth',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync your content calendar and push outputs to a Notion database.',
    icon: FileText,
    category: 'Import',
    connectionType: 'oauth',
    color: 'text-zinc-700',
    bg: 'bg-zinc-100',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Import meeting recordings automatically.',
    icon: Video,
    category: 'Import',
    connectionType: 'coming_soon',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },

  // ── Data ───────────────────────────────────────────────────────
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Sync your content calendar and analytics to an Airtable base.',
    icon: Table2,
    category: 'Data',
    connectionType: 'api_key',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Export analytics and output data to a Google Sheet.',
    icon: Table2,
    category: 'Data',
    connectionType: 'oauth',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },

  // ── Automation ─────────────────────────────────────────────────
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Trigger Zaps when outputs are ready. Use our webhook URL in Zapier.',
    icon: Webhook,
    category: 'Automation',
    connectionType: 'managed',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    id: 'make',
    name: 'Make',
    description: 'Trigger Make scenarios from Clipflow webhooks.',
    icon: Webhook,
    category: 'Automation',
    connectionType: 'managed',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
]

const CONNECTION_TYPE_LABEL: Record<ConnectionType, string> = {
  webhook: 'Webhook',
  api_key: 'API key',
  oauth: 'OAuth',
  coming_soon: 'Coming soon',
  managed: 'Via webhook',
}

const CONNECTION_TYPE_STYLE: Record<ConnectionType, string> = {
  webhook: 'bg-blue-50 text-blue-700 border-blue-200',
  api_key: 'bg-violet-50 text-violet-700 border-violet-200',
  oauth: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  coming_soon: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  managed: 'bg-zinc-100 text-zinc-600 border-zinc-200',
}

export default async function IntegrationsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = cookies().get(WORKSPACE_COOKIE)?.value ?? ''

  let connectedIds = new Set<string>()
  if (workspaceId) {
    try {
      const supabase = createClient()
      const { data: ws } = await supabase
        .from('workspaces')
        .select('branding')
        .eq('id', workspaceId)
        .single()
      const branding = (ws?.branding ?? {}) as Record<string, unknown>
      const integrations = (branding.integrations ?? {}) as Record<string, unknown>
      connectedIds = new Set(Object.keys(integrations))
    } catch { /* ignore */ }
  }

  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))]
  const connectedCount = INTEGRATIONS.filter((i) => connectedIds.has(i.id)).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Connect Clipflow with your existing tools. Notifications go to Slack
          or Discord, content exports to Beehiiv, WordPress or Medium, and data
          syncs to Airtable or Google Sheets.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {connectedCount} connected
          </span>
          <span className="text-muted-foreground/40">·</span>
          {/* Connection type legend */}
          {(['oauth', 'api_key', 'webhook'] as ConnectionType[]).map((t) => (
            <span
              key={t}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${CONNECTION_TYPE_STYLE[t]}`}
            >
              {CONNECTION_TYPE_LABEL[t]}
            </span>
          ))}
        </div>
      </div>

      {/* How connection types work */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Connection types explained
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3 text-xs text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground">OAuth</span> — Click Connect,
            log in to the service (Google, Notion), we get access automatically.
            Nothing to copy.
          </div>
          <div>
            <span className="font-semibold text-foreground">API key</span> — Paste your
            API key from the service (Beehiiv, Airtable). Found in their settings.
            Takes 1 minute.
          </div>
          <div>
            <span className="font-semibold text-foreground">Webhook</span> — Paste a
            webhook URL you create in Slack or Discord. We&apos;ll POST notifications
            there when events happen.
          </div>
        </div>
      </div>

      {/* Social publishing notice */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <span className="mt-0.5 shrink-0 text-lg">↑</span>
        <div>
          <p className="font-semibold">Social publishing (TikTok, Instagram, YouTube, LinkedIn)</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Handled via Upload-Post — connect it in{' '}
            <Link href="/settings/ai-keys" className="font-medium text-primary underline-offset-4 hover:underline">
              API Keys → Publishing
            </Link>
            . One key, all four platforms, no OAuth setup needed.
          </p>
        </div>
      </div>

      {/* Integration groups */}
      {categories.map((category) => {
        const items = INTEGRATIONS.filter((i) => i.category === category)
        return (
          <section key={category} className="space-y-3">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {category}
            </h2>
            <div className="space-y-2">
              {items.map((integration) => {
                const isConnected = connectedIds.has(integration.id)
                return (
                  <div
                    key={integration.id}
                    className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                      isConnected
                        ? 'border-primary/20 bg-primary/5'
                        : integration.connectionType === 'coming_soon'
                          ? 'border-border/40 opacity-60'
                          : 'border-border/60 hover:border-border'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${integration.bg}`}>
                      <integration.icon className={`h-4 w-4 ${integration.color}`} />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{integration.name}</p>
                        <span
                          className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${CONNECTION_TYPE_STYLE[integration.connectionType]}`}
                        >
                          {CONNECTION_TYPE_LABEL[integration.connectionType]}
                        </span>
                        {isConnected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            ✓ Connected
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>

                    {/* Action */}
                    {integration.connectionType !== 'coming_soon' && workspaceId && (
                      <div className="shrink-0">
                        <ConnectDialog
                          integrationId={integration.id}
                          integrationName={integration.name}
                          workspaceId={workspaceId}
                          isConnected={isConnected}
                          connectionType={integration.connectionType}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
