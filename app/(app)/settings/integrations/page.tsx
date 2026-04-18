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
 * Integrations — honest version.
 *
 * The old page advertised twelve cards (Notion, Drive, Sheets, LinkedIn,
 * Airtable, Beehiiv, WordPress, Medium, Zapier, Make, Zoom, …) but
 * only Slack and Discord webhooks actually fire at runtime — everything
 * else just stored config under `branding.integrations[id]` and never
 * did anything on approve / export / publish. That's worse than not
 * showing them: it makes the product feel half-built and gives users
 * a 0/12 progress bar that can never hit 100 %.
 *
 * Ship what works. "Notifications" (Slack + Discord) is the only
 * category with real plumbing. Social publishing gets its own
 * banner because it lives in AI Connections. Everything else is a
 * request-it CTA at the bottom so the demand signal lands in our
 * inbox instead of the UI.
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

const NOTIFICATION_INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'slack',
    name: 'Slack',
    connectionType: 'webhook',
    benefit: 'Get a Slack message the moment a draft is approved, exported, or published.',
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
            Send events to the tools you already use. Publishing to social
            platforms is set up separately.
          </p>
        </div>
      </div>

      {/* ── OAuth feedback ── */}
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
              You&apos;ll start getting messages the next time content moves through the pipeline.
            </p>
          </div>
        </div>
      )}

      {/* ── Social publishing pointer ── */}
      <Link
        href="/settings/ai-keys"
        className="group flex items-start gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] to-background p-4 transition-all hover:-translate-y-px hover:border-primary/30 hover:shadow-md"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Send className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">
            Looking for TikTok, Reels, Shorts, or LinkedIn publishing?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Social auto-publishing lives in AI Connections — one Upload-Post key covers all four.
          </p>
        </div>
        <span className="self-center text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Open →
        </span>
      </Link>

      {/* ── Notifications section (the only real category) ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold">Notifications</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Get a ping when content moves through your pipeline.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {NOTIFICATION_INTEGRATIONS.map((integration) => {
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

      {/* ── Request-an-integration footer. Replaces the 10 aspirational
           cards that used to sit here and never did anything. A single
           mailto collects real demand. ── */}
      <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Zap className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">Need Notion, Airtable, Zapier, or something else?</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            We ship the integrations our users actually ask for.{' '}
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
