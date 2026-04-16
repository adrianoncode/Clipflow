import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plug, Send, Zap, Check } from 'lucide-react'

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
  connectionType: ConnectionType
  benefit: string
  /** Brand letter / symbol shown in the icon square */
  letter: string
  /** Tailwind bg class for the icon */
  iconBg: string
  /** Tailwind text class for the letter */
  iconText: string
}

// ─── Integration catalogue ────────────────────────────────────────────────────

const GROUPS: { title: string; subtitle: string; color: string; items: IntegrationDef[] }[] = [
  {
    title: 'One-click OAuth',
    subtitle: 'Connect in seconds — no keys to copy',
    color: 'bg-violet-500',
    items: [
      {
        id: 'notion',
        name: 'Notion',
        connectionType: 'oauth',
        benefit: 'Sync AI outputs straight into any Notion database.',
        letter: 'N',
        iconBg: 'bg-zinc-900',
        iconText: 'text-white',
      },
      {
        id: 'google-drive',
        name: 'Google Drive',
        connectionType: 'oauth',
        benefit: 'Import source videos and docs from Drive.',
        letter: 'G',
        iconBg: 'bg-gradient-to-br from-blue-500 via-green-500 to-yellow-400',
        iconText: 'text-white',
      },
      {
        id: 'google-sheets',
        name: 'Google Sheets',
        connectionType: 'oauth',
        benefit: 'Export analytics and content calendar to a Sheet.',
        letter: 'S',
        iconBg: 'bg-emerald-600',
        iconText: 'text-white',
      },
      {
        id: 'airtable',
        name: 'Airtable',
        connectionType: 'oauth',
        benefit: 'Auto-sync approved outputs to your Airtable base.',
        letter: 'A',
        iconBg: 'bg-gradient-to-br from-cyan-400 to-teal-500',
        iconText: 'text-white',
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        connectionType: 'oauth',
        benefit: 'Auto-publish exported LinkedIn outputs directly.',
        letter: 'in',
        iconBg: 'bg-[#0A66C2]',
        iconText: 'text-white',
      },
      {
        id: 'youtube',
        name: 'YouTube',
        connectionType: 'oauth',
        benefit: 'Connect your channel for publishing and analytics.',
        letter: '▶',
        iconBg: 'bg-red-600',
        iconText: 'text-white',
      },
    ],
  },
  {
    title: 'Notifications',
    subtitle: 'Get pinged when renders and outputs are ready',
    color: 'bg-indigo-500',
    items: [
      {
        id: 'slack',
        name: 'Slack',
        connectionType: 'webhook',
        benefit: 'Post render-complete and output-ready alerts to any channel.',
        letter: '#',
        iconBg: 'bg-[#4A154B]',
        iconText: 'text-white',
      },
      {
        id: 'discord',
        name: 'Discord',
        connectionType: 'webhook',
        benefit: 'Announce new content drops to your Discord server.',
        letter: '◈',
        iconBg: 'bg-[#5865F2]',
        iconText: 'text-white',
      },
    ],
  },
  {
    title: 'Publishing',
    subtitle: 'Push finished content straight to your platforms',
    color: 'bg-orange-500',
    items: [
      {
        id: 'beehiiv',
        name: 'Beehiiv',
        connectionType: 'api_key',
        benefit: 'Push newsletter drafts directly into your Beehiiv publication.',
        letter: 'B',
        iconBg: 'bg-gradient-to-br from-orange-400 to-red-500',
        iconText: 'text-white',
      },
      {
        id: 'wordpress',
        name: 'WordPress',
        connectionType: 'api_key',
        benefit: 'Auto-publish blog posts from AI outputs to your WP site.',
        letter: 'W',
        iconBg: 'bg-[#21759B]',
        iconText: 'text-white',
      },
      {
        id: 'medium',
        name: 'Medium',
        connectionType: 'api_key',
        benefit: 'One-click publish polished articles to Medium.',
        letter: 'M',
        iconBg: 'bg-zinc-900',
        iconText: 'text-white',
      },
    ],
  },
  {
    title: 'Automation',
    subtitle: 'Wire Clipflow into any workflow',
    color: 'bg-amber-500',
    items: [
      {
        id: 'zapier',
        name: 'Zapier',
        connectionType: 'managed',
        benefit: 'Trigger any Zap when renders or outputs are ready.',
        letter: 'Z',
        iconBg: 'bg-[#FF4A00]',
        iconText: 'text-white',
      },
      {
        id: 'make',
        name: 'Make',
        connectionType: 'managed',
        benefit: 'Trigger Make scenarios from Clipflow events.',
        letter: 'M',
        iconBg: 'bg-gradient-to-br from-violet-600 to-purple-700',
        iconText: 'text-white',
      },
    ],
  },
  {
    title: 'Coming soon',
    subtitle: 'On the roadmap',
    color: 'bg-zinc-400',
    items: [
      {
        id: 'zoom',
        name: 'Zoom',
        connectionType: 'coming_soon',
        benefit: 'Auto-import meeting recordings for transcript + repurposing.',
        letter: 'Z',
        iconBg: 'bg-[#2D8CFF]',
        iconText: 'text-white',
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────

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

  const allItems = GROUPS.flatMap((g) => g.items)
  const connectedCount = allItems.filter((i) => connectedIds.has(i.id)).length
  const totalCount = allItems.filter((i) => i.connectionType !== 'coming_soon').length

  const urlError = searchParams.error
  const urlConnected = searchParams.connected

  return (
    <div className="space-y-10">

      {/* ── Header ── */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <Plug className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Integrations</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Connect Clipflow to the tools you already use. OAuth integrations take one click.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border/60">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.round((connectedCount / totalCount) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
            {connectedCount} / {totalCount} connected
          </span>
        </div>
      </div>

      {/* ── OAuth feedback ── */}
      {urlError && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
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
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-3 w-3 text-white" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800">
              {urlConnected.replace(/-/g, ' ')} connected
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">Ready to use across Clipflow.</p>
          </div>
        </div>
      )}

      {/* ── Social publishing notice ── */}
      <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.07] to-background p-5">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-primary/10" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Send className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Social publishing → TikTok, Instagram, YouTube, LinkedIn</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up in{' '}
              <Link href="/settings/ai-keys" className="font-semibold text-primary underline-offset-2 hover:underline">
                API Keys → Publishing
              </Link>
              {' '}via Upload-Post. One key, all four platforms, no OAuth needed.
            </p>
          </div>
        </div>
      </div>

      {/* ── Integration groups ── */}
      {GROUPS.map((group) => (
        <section key={group.title} className="space-y-4">
          {/* Group header */}
          <div className="flex items-center gap-3">
            <span className={`h-4 w-1 rounded-full ${group.color}`} />
            <div>
              <h2 className="text-sm font-bold">{group.title}</h2>
              <p className="text-xs text-muted-foreground">{group.subtitle}</p>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((integration) => {
              const isConnected = connectedIds.has(integration.id)
              const isComingSoon = integration.connectionType === 'coming_soon'

              return (
                <div
                  key={integration.id}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                    isComingSoon
                      ? 'border-border/40 bg-muted/20 opacity-60'
                      : isConnected
                        ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-background shadow-sm hover:-translate-y-1.5 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10'
                        : 'border-border/50 bg-card hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/[0.08]'
                  }`}
                >
                  {/* Shine sweep on hover */}
                  {!isComingSoon && (
                    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  )}

                  {/* Connected badge */}
                  {isConnected && (
                    <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      Live
                    </div>
                  )}
                  {isComingSoon && (
                    <div className="absolute right-4 top-4 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                      Soon
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2 ${integration.iconBg} ${integration.iconText}`}
                    aria-hidden
                  >
                    {integration.letter}
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">{integration.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {integration.benefit}
                    </p>
                  </div>

                  {/* Action */}
                  {!isComingSoon && workspaceId && (
                    <div className="mt-4">
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

      {/* ── Bottom CTA ── */}
      <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-muted/30 p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Zap className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">Missing an integration?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            We add integrations every sprint.{' '}
            <a
              href="mailto:support@clipflow.to?subject=Integration request"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Request one →
            </a>
          </p>
        </div>
      </div>

    </div>
  )
}
