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
  Send,
  Check,
} from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { ConnectDialog } from '@/components/integrations/connect-dialog'

export const metadata = { title: 'Integrations' }
export const dynamic = 'force-dynamic'

const WORKSPACE_COOKIE = 'clipflow.current_workspace'

type ConnectionType = 'webhook' | 'api_key' | 'oauth' | 'coming_soon' | 'managed'

interface IntegrationDef {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  connectionType: ConnectionType
  iconColor: string
  iconBg: string
  benefit: string
}

const INTEGRATIONS: Record<string, IntegrationDef[]> = {
  'One-click OAuth': [
    {
      id: 'notion',
      name: 'Notion',
      icon: FileText,
      connectionType: 'oauth',
      iconColor: 'text-zinc-700',
      iconBg: 'bg-zinc-100',
      benefit: 'Sync outputs to a Notion database.',
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      icon: Cloud,
      connectionType: 'oauth',
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-50',
      benefit: 'Import videos and docs from Drive.',
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      icon: Table2,
      connectionType: 'oauth',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
      benefit: 'Export analytics to a Sheet.',
    },
  ],
  'Paste a Webhook URL': [
    {
      id: 'slack',
      name: 'Slack',
      icon: MessageSquare,
      connectionType: 'webhook',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      benefit: 'Get notified when renders finish.',
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: MessageSquare,
      connectionType: 'webhook',
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      benefit: 'Post updates to your Discord server.',
    },
  ],
  'Paste an API Key': [
    {
      id: 'beehiiv',
      name: 'Beehiiv',
      icon: Mail,
      connectionType: 'api_key',
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
      benefit: 'Push newsletters directly to Beehiiv.',
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      icon: Globe,
      connectionType: 'api_key',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      benefit: 'Publish blog posts to your site.',
    },
    {
      id: 'medium',
      name: 'Medium',
      icon: FileText,
      connectionType: 'api_key',
      iconColor: 'text-zinc-700',
      iconBg: 'bg-zinc-100',
      benefit: 'One-click publish to Medium.',
    },
    {
      id: 'airtable',
      name: 'Airtable',
      icon: Table2,
      connectionType: 'api_key',
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
      benefit: 'Sync your content calendar to Airtable.',
    },
  ],
  'Automation Platforms': [
    {
      id: 'zapier',
      name: 'Zapier',
      icon: Webhook,
      connectionType: 'managed',
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
      benefit: 'Trigger any Zap when outputs are ready.',
    },
    {
      id: 'make',
      name: 'Make',
      icon: Webhook,
      connectionType: 'managed',
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
      benefit: 'Trigger Make scenarios from Clipflow.',
    },
  ],
  'Coming Soon': [
    {
      id: 'zoom',
      name: 'Zoom',
      icon: Video,
      connectionType: 'coming_soon',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      benefit: 'Auto-import meeting recordings.',
    },
  ],
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { error?: string; connected?: string }
}) {
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

  const allIntegrations = Object.values(INTEGRATIONS).flat()
  const connectedCount = allIntegrations.filter((i) => connectedIds.has(i.id)).length
  const urlError = searchParams.error
  const urlConnected = searchParams.connected

  return (
    <div className="max-w-2xl space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Clipflow to your existing tools. Start with the easiest ones — OAuth is one click.
        </p>
        {connectedCount > 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {connectedCount} connected
            </span>
          </p>
        )}
      </div>

      {/* Social publishing notice */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <Send className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="font-semibold">Social publishing → TikTok, Instagram, YouTube, LinkedIn</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Set up in{' '}
            <Link href="/settings/ai-keys" className="font-medium text-primary underline-offset-2 hover:underline">
              API Keys → Publishing
            </Link>
            {' '}via Upload-Post. One key, all four platforms, no OAuth needed.
          </p>
        </div>
      </div>

      {/* Feedback from OAuth redirect */}
      {urlError && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">!</span>
          <div>
            <p className="font-semibold text-destructive">Connection failed</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {urlError === 'session_expired'
                ? 'Session timed out — click Connect again.'
                : urlError === 'auth_cancelled'
                ? 'Sign-in cancelled — try again when ready.'
                : decodeURIComponent(urlError)}
            </p>
          </div>
        </div>
      )}
      {urlConnected && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">✓</span>
          <div>
            <p className="font-semibold text-emerald-800">
              {urlConnected.replace(/-/g, ' ')} connected
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Ready to use.</p>
          </div>
        </div>
      )}

      {/* Integration sections */}
      {Object.entries(INTEGRATIONS).map(([groupTitle, items]) => (
        <section key={groupTitle} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {groupTitle}
          </h2>

          <div className="overflow-hidden rounded-xl border border-border/60">
            {items.map((integration, idx) => {
              const Icon = integration.icon
              const isConnected = connectedIds.has(integration.id)
              const isLast = idx === items.length - 1

              return (
                <div
                  key={integration.id}
                  className={`flex items-center gap-4 px-4 py-3.5 ${!isLast ? 'border-b border-border/50' : ''} ${isConnected ? 'bg-emerald-50/30' : 'bg-card'}`}
                >
                  {/* Icon */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${integration.iconBg}`}>
                    <Icon className={`h-4 w-4 ${integration.iconColor}`} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{integration.name}</span>
                      {isConnected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <Check className="h-2.5 w-2.5" />
                          Connected
                        </span>
                      )}
                      {integration.connectionType === 'coming_soon' && (
                        <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{integration.benefit}</p>
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
      ))}
    </div>
  )
}
