import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Check, Zap } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { createClient } from '@/lib/supabase/server'
import { ConnectDialog } from '@/components/integrations/connect-dialog'
import {
  AirtableLogo,
  BeehiivLogo,
  DiscordLogo,
  GoogleDriveLogo,
  GoogleSheetsLogo,
  NotionLogo,
  SlackLogo,
  ZapierLogo,
} from '@/components/brand-logos'
import type { ReactNode } from 'react'

export const metadata = { title: 'Integrations' }
export const dynamic = 'force-dynamic'

const WORKSPACE_COOKIE = 'clipflow.current_workspace'

/**
 * Integrations.
 *
 * Workflow tools that fire when content moves through the pipeline.
 * Channels (social destinations) live on a separate page — see the
 * pointer card below the header.
 */

type ConnectionType = 'webhook' | 'api_key' | 'oauth' | 'coming_soon' | 'managed'

interface IntegrationDef {
  id: string
  name: string
  connectionType: ConnectionType
  benefit: string
  trigger: string
  Logo: (props: { size?: number; className?: string }) => ReactNode
  /** Tailwind classes for the brand tile. White-bg brands get a border. */
  tileBg: string
  /** Logo color: 'white' renders as text-white; 'native' uses brand-color SVG paths inside the logo. */
  logoColor: 'white' | 'native' | 'dark'
}

interface IntegrationGroup {
  title: string
  subtitle: string
  items: IntegrationDef[]
}

const GROUPS: IntegrationGroup[] = [
  {
    title: 'Notifications',
    subtitle: 'Get a ping in your team chat when content moves.',
    items: [
      {
        id: 'slack',
        name: 'Slack',
        connectionType: 'webhook',
        benefit: 'Post to a Slack channel when a draft is approved, exported, or published.',
        trigger: 'Fires on approve · export · publish',
        Logo: SlackLogo,
        tileBg: 'bg-white border border-border/60',
        logoColor: 'native',
      },
      {
        id: 'discord',
        name: 'Discord',
        connectionType: 'webhook',
        benefit: 'Ping a Discord channel when new content is ready to review.',
        trigger: 'Fires on approve · export · publish',
        Logo: DiscordLogo,
        tileBg: 'bg-[#5865F2]',
        logoColor: 'white',
      },
    ],
  },
  {
    title: 'Sync & publish',
    subtitle: 'Send approved content out to the workspace tools you live in.',
    items: [
      {
        id: 'notion',
        name: 'Notion',
        connectionType: 'oauth',
        benefit: 'Create a Notion page with the draft each time you approve or export.',
        trigger: 'Fires on approve · export',
        Logo: NotionLogo,
        tileBg: 'bg-white border border-border/60',
        logoColor: 'dark',
      },
      {
        id: 'google-sheets',
        name: 'Google Sheets',
        connectionType: 'oauth',
        benefit: 'Append a row — date, title, platform, body — to your tracking sheet.',
        trigger: 'Fires on approve · export',
        Logo: GoogleSheetsLogo,
        tileBg: 'bg-[#0F9D58]',
        logoColor: 'white',
      },
      {
        id: 'google-drive',
        name: 'Google Drive',
        connectionType: 'oauth',
        benefit: 'Connect your Drive for upcoming import flows. Already linked? You’re set.',
        trigger: 'Import source (coming soon)',
        Logo: GoogleDriveLogo,
        tileBg: 'bg-white border border-border/60',
        logoColor: 'native',
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
    <div className="space-y-6">
      {urlError ? (
        <FeedbackBanner tone="error">
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
        </FeedbackBanner>
      ) : null}
      {urlConnected ? (
        <FeedbackBanner tone="success">
          <p className="font-semibold text-emerald-800">
            {urlConnected.replace(/-/g, ' ')} connected
          </p>
          <p className="mt-0.5 text-xs text-emerald-700">
            Events will fire the next time content moves through the pipeline.
          </p>
        </FeedbackBanner>
      ) : null}

      {/* ── Integration groups ── */}
      {GROUPS.map((group) => (
        <section key={group.title} className="space-y-3">
          <div>
            <h2 className="text-[13px] font-bold">{group.title}</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{group.subtitle}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((integration) => {
              const isConnected = connectedIds.has(integration.id)
              return (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  workspaceId={workspaceId}
                  isConnected={isConnected}
                />
              )
            })}
          </div>
        </section>
      ))}

      {/* ── Request-an-integration footer ── */}
      <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/30 p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Zap className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-[13px] font-semibold">Need Airtable, Zapier, Beehiiv, or something else?</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
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

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

/**
 * Per-integration halo glow color — radial gradient tucked behind
 * the brand tile. Real brand colors: Slack aubergine, Discord blue,
 * Notion-grey, Sheets green, Drive blue. Reads "this row is alive
 * and tied to the brand", not generic.
 */
const INTEGRATION_GLOW: Record<string, string> = {
  slack: 'rgba(74,21,75,0.30)',
  discord: 'rgba(88,101,242,0.34)',
  notion: 'rgba(15,15,15,0.26)',
  'google-sheets': 'rgba(15,157,88,0.32)',
  'google-drive': 'rgba(66,133,244,0.28)',
}

function IntegrationCard({
  integration,
  workspaceId,
  isConnected,
}: {
  integration: IntegrationDef
  workspaceId: string
  isConnected: boolean
}) {
  const Logo = integration.Logo
  const logoTint =
    integration.logoColor === 'white'
      ? 'text-white'
      : integration.logoColor === 'dark'
        ? 'text-foreground'
        : '' // 'native' = SVG carries its own colors
  const glow =
    INTEGRATION_GLOW[integration.id] ?? 'rgba(42,26,61,0.22)'

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
        isConnected
          ? 'border-emerald-200/70 bg-emerald-50/30'
          : 'border-border/60 bg-card hover:-translate-y-px hover:border-border'
      }`}
      style={{
        boxShadow: isConnected
          ? '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04), 0 12px 28px -22px rgba(16,185,129,0.20)'
          : '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04), 0 12px 28px -22px rgba(42,26,61,0.20)',
      }}
    >
      {/* Per-integration halo tucked behind the logo. Subtle until
          hover, swells on group:hover so the card visibly reacts. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-8 -top-12 h-36 w-36 rounded-full opacity-55 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle, ${glow} 0%, transparent 65%)`,
        }}
      />
      {/* Edge-light hairline on the top — same chassis vocabulary as
          the rest of the premium cards. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
      />

      {/* Top row — brand tile + status pill */}
      <div className="relative flex items-start justify-between gap-3">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-md transition-transform duration-300 group-hover:-rotate-[3deg] group-hover:scale-[1.05] ${integration.tileBg} ${logoTint}`}
          aria-hidden
          style={{
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.18) inset, 0 6px 14px -6px rgba(42,26,61,0.18)',
          }}
        >
          <Logo size={24} />
        </span>
        {isConnected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/[0.14] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        ) : null}
      </div>

      <div className="relative mt-4 flex-1">
        <h3
          className="text-[16px] font-bold leading-tight tracking-tight text-foreground"
          style={{
            fontFamily:
              'var(--font-inter-tight), var(--font-inter), sans-serif',
          }}
        >
          {integration.name}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">
          {integration.benefit}
        </p>
        <p
          className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/75"
          style={{
            fontFamily:
              'var(--font-inter-tight), var(--font-inter), sans-serif',
          }}
        >
          <span aria-hidden className="inline-block h-px w-4 bg-primary/40" />
          {integration.trigger}
        </p>
      </div>

      {workspaceId ? (
        <div className="relative mt-5">
          <ConnectDialog
            integrationId={integration.id}
            integrationName={integration.name}
            workspaceId={workspaceId}
            isConnected={isConnected}
            connectionType={integration.connectionType}
          />
        </div>
      ) : null}
    </div>
  )
}

function FeedbackBanner({
  tone,
  children,
}: {
  tone: 'error' | 'success'
  children: ReactNode
}) {
  if (tone === 'error') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
          !
        </span>
        <div className="min-w-0">{children}</div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
