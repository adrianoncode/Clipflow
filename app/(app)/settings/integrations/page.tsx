import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, Plug, Send, Zap } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { createClient } from '@/lib/supabase/server'
import { ConnectDialog } from '@/components/integrations/connect-dialog'

export const metadata = { title: 'Integrations' }
export const dynamic = 'force-dynamic'

const WORKSPACE_COOKIE = 'clipflow.current_workspace'

/**
 * Integrations.
 *
 * This page only shows integrations that actually fire at runtime:
 *
 *   OAuth via Composio (lib/integrations/composio.ts):
 *     - Notion         → NOTION_CREATE_A_PAGE on approve/export
 *     - Google Drive   → OAuth connectable (for future import flows)
 *     - Google Sheets  → GOOGLESHEETS_BATCH_UPDATE on approve/export
 *     - LinkedIn       → LINKEDIN_CREATE_A_LINKED_IN_POST on export
 *
 *   Webhook (lib/integrations/dispatch-integrations.ts):
 *     - Slack   → message on approve/export/publish
 *     - Discord → message on approve/export/publish
 *
 * Anything else lives behind "Request an integration" at the bottom —
 * aspirational cards that don't fire would just mislead users.
 *
 * Note on LinkedIn: there are two LinkedIn paths in the product.
 * Composio LinkedIn here posts to your personal feed when a draft is
 * exported. Upload-Post (Settings → Channels) publishes to LinkedIn as
 * part of the TikTok / Instagram / YouTube / LinkedIn bundle on a
 * schedule. The pointer-card below routes heavy social-publishing
 * users there instead.
 */

type ConnectionType = 'webhook' | 'api_key' | 'oauth' | 'coming_soon' | 'managed'

interface IntegrationDef {
  id: string
  name: string
  connectionType: ConnectionType
  benefit: string
  trigger: string
  letter: string
  iconBg: string
  iconText: string
}

interface IntegrationGroup {
  title: string
  subtitle: string
  items: IntegrationDef[]
}

const GROUPS: IntegrationGroup[] = [
  {
    title: 'Notifications',
    subtitle: 'Get a ping when content moves through your pipeline.',
    items: [
      {
        id: 'slack',
        name: 'Slack',
        connectionType: 'webhook',
        benefit: 'Message your Slack channel when a draft is approved, exported, or published.',
        trigger: 'Fires on approve · export · publish',
        letter: '#',
        iconBg: 'bg-[#4A154B]',
        iconText: 'text-white',
      },
      {
        id: 'discord',
        name: 'Discord',
        connectionType: 'webhook',
        benefit: 'Ping your Discord channel when new content is ready to review.',
        trigger: 'Fires on approve · export · publish',
        letter: '◈',
        iconBg: 'bg-[#5865F2]',
        iconText: 'text-white',
      },
    ],
  },
  {
    title: 'Sync & publish',
    subtitle: 'Send approved content out to the tools you already work in.',
    items: [
      {
        id: 'notion',
        name: 'Notion',
        connectionType: 'oauth',
        benefit: 'Create a Notion page with the draft every time you approve or export content.',
        trigger: 'Fires on approve · export',
        letter: 'N',
        iconBg: 'bg-zinc-900',
        iconText: 'text-white',
      },
      {
        id: 'google-sheets',
        name: 'Google Sheets',
        connectionType: 'oauth',
        benefit: 'Append a row — date, title, platform, body — to your tracking sheet automatically.',
        trigger: 'Fires on approve · export',
        letter: 'S',
        iconBg: 'bg-emerald-600',
        iconText: 'text-white',
      },
      {
        id: 'google-drive',
        name: 'Google Drive',
        connectionType: 'oauth',
        benefit: 'Connect your Drive for future import flows. Already connected? You\u2019re set up.',
        trigger: 'Import source (coming soon)',
        letter: 'G',
        iconBg: 'bg-gradient-to-br from-blue-500 via-green-500 to-yellow-400',
        iconText: 'text-white',
      },
    ],
  },
]

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { error?: string; connected?: string }
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal') ?? workspaces[0]
  const currentWorkspace = workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal
  const workspaceId = currentWorkspace?.id ?? ''

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

  const urlError = searchParams.error
  const urlConnected = searchParams.connected

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Plug className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Integrations</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            Workflow tools — notifications, CMS exports, content-calendar
            sync. Social publishing (TikTok, Instagram, YouTube, LinkedIn,
            X, Threads) lives in <strong className="font-semibold text-foreground">Channels</strong>.
          </p>
        </div>
      </div>

      {/* ── OAuth feedback banners ── */}
      {urlError && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">!</span>
          <div>
            <p className="font-semibold text-destructive">Connection failed</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {urlError === 'session_expired'
                ? 'Took too long — click Connect to try again.'
                : urlError === 'auth_cancelled'
                  ? 'Sign-in was cancelled — try again when ready.'
                  : urlError === 'missing_params'
                    ? 'Something went wrong. Please refresh and try again.'
                    : decodeURIComponent(urlError)}
            </p>
          </div>
        </div>
      )}
      {urlConnected && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-3 w-3 text-white" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800">
              {urlConnected.replace(/-/g, ' ')} connected
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              You&apos;ll start getting events the next time content moves through the pipeline.
            </p>
          </div>
        </div>
      )}

      {/* ── Pointer to Channels. Integrations and Channels are two
           different jobs — integrations send signals into tools, channels
           push finished content out to social feeds. ── */}
      <Link
        href="/settings/channels"
        className="group flex items-start gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] to-background p-4 transition-all hover:-translate-y-px hover:border-primary/30 hover:shadow-md"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Send className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">
            Publish to socials — TikTok, Instagram, YouTube, LinkedIn &amp; more
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Channels is where your social destinations live — schedule, auto-post, track performance.
          </p>
        </div>
        <span className="self-center text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Open →
        </span>
      </Link>

      {/* ── Integration groups ── */}
      {GROUPS.map((group) => (
        <section key={group.title} className="space-y-3">
          <div>
            <h2 className="text-sm font-bold">{group.title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{group.subtitle}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((integration) => {
              const isConnected = connectedIds.has(integration.id)
              return (
                <div
                  key={integration.id}
                  className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
                    isConnected
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-border/60 bg-card hover:-translate-y-px hover:border-primary/25 hover:shadow-md'
                  }`}
                >
                  {isConnected && (
                    <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      Live
                    </div>
                  )}

                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black ${integration.iconBg} ${integration.iconText}`}
                    aria-hidden
                  >
                    {integration.letter}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-bold">{integration.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {integration.benefit}
                    </p>
                    {isConnected && (
                      <p className="mt-2 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                        {integration.trigger}
                      </p>
                    )}
                  </div>

                  {workspaceId && (
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

      {/* ── Request-an-integration footer ── */}
      <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Zap className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">Need Airtable, Zapier, Beehiiv, or something else?</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            We ship integrations our users actually ask for.{' '}
            <a
              href="mailto:support@clipflow.to?subject=Integration request"
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              Tell us what you want →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
