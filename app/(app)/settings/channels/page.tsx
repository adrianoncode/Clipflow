import Link from 'next/link'
import { cookies } from 'next/headers'
import { AlertTriangle, ArrowRight, Check, ChevronDown, Clock, Radio, Sparkles, Zap } from 'lucide-react'

import { ServiceCard } from '@/components/ai-keys/service-card'
import { SERVICE_DIRECTORY } from '@/components/ai-keys/service-directory'
import { PageHeading } from '@/components/workspace/page-heading'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { createClient } from '@/lib/supabase/server'

import { XConnectCard } from '@/components/channels/x-connect-card'
import {
  FacebookLogo,
  InstagramLogo,
  LinkedInLogo,
  ThreadsLogo,
  TikTokLogo,
  UploadPostLogo,
  YouTubeLogo,
} from '@/components/brand-logos'
import type { ReactNode } from 'react'

// Each channel card knows which connection path it uses. This is the
// single mental model for users: "where does this platform go through?"
type ChannelProvider =
  | 'composio'      // Managed OAuth via Composio
  | 'upload-post'   // Video bundle via Upload-Post
  | 'byok-keys'     // Bring-your-own API credentials (e.g. X)
  | 'catalog-wait'  // Waiting on upstream catalog (e.g. Threads)

interface ChannelDef {
  id: string
  name: string
  provider: ChannelProvider
  /** Brand tile background (Tailwind classes for solid or gradient). */
  tileBg: string
  /** White-on-brand SVG logo. */
  Logo: (props: { size?: number; className?: string }) => ReactNode
  /** One-liner shown on the card. */
  note: string
  /** Inline warning expander shown only when set (Instagram). */
  warning?: string
  /** "Why isn't this live?" expander body (only for catalog-wait). */
  explainer?: string
}

const CHANNELS: ChannelDef[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    provider: 'composio',
    tileBg: 'bg-[#0A66C2]',
    Logo: LinkedInLogo,
    note: 'Post text + clips to your personal feed the moment you approve.',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    provider: 'composio',
    tileBg: 'bg-[#FF0000]',
    Logo: YouTubeLogo,
    note: 'Upload Shorts straight to your channel with title + description.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    provider: 'composio',
    tileBg: 'bg-gradient-to-br from-[#FEDA77] via-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    Logo: InstagramLogo,
    note: 'Publish Reels to a connected IG account.',
    warning: 'Needs a Business/Creator account linked to a Facebook Page.',
  },
  {
    id: 'facebook',
    name: 'Facebook Pages',
    provider: 'composio',
    tileBg: 'bg-[#1877F2]',
    Logo: FacebookLogo,
    note: 'Push clips and link posts to a Facebook Page you manage.',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    provider: 'upload-post',
    tileBg: 'bg-black',
    Logo: TikTokLogo,
    note: 'Routed through the Upload-Post bundle below — one key, four platforms.',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    provider: 'byok-keys',
    tileBg: 'bg-black',
    Logo: () => null, // X uses its own dedicated wizard card
    note: '',
  },
  {
    id: 'threads',
    name: 'Threads',
    provider: 'catalog-wait',
    tileBg: 'bg-zinc-900',
    Logo: ThreadsLogo,
    note: 'Meta Threads isn’t in the Composio catalog yet.',
    explainer:
      'Threads opened its publishing API in 2024 but Composio hasn’t wrapped it. We’ll enable this card the day they do — no action needed from you.',
  },
]

const UP_BUNDLE_PLATFORMS = [
  { name: 'TikTok', tile: 'bg-black', Logo: TikTokLogo },
  { name: 'Instagram', tile: 'bg-gradient-to-br from-[#FEDA77] via-[#F58529] via-[#DD2A7B] to-[#8134AF]', Logo: InstagramLogo },
  { name: 'YouTube', tile: 'bg-[#FF0000]', Logo: YouTubeLogo },
  { name: 'LinkedIn', tile: 'bg-[#0A66C2]', Logo: LinkedInLogo },
] as const

export const metadata = { title: 'Channels' }

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: { error?: string; connected?: string }
}) {
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  if (!currentWorkspace) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Channels</h1>
        <p className="text-sm text-muted-foreground">No workspace selected.</p>
      </div>
    )
  }

  const keys = await getAiKeys(currentWorkspace.id)
  const isOwner = currentWorkspace.role === 'owner'
  const publishServices = SERVICE_DIRECTORY.filter((s) => s.category === 'publish')

  const keysByProvider = keys.reduce<Record<string, typeof keys>>((acc, k) => {
    ;(acc[k.provider] = acc[k.provider] ?? []).push(k)
    return acc
  }, {})

  let connectedChannelIds = new Set<string>()
  let xConnection: { handle?: string; connectedAt?: string } | null = null
  try {
    const supabase = createClient()
    const { data: ws } = await supabase
      .from('workspaces')
      .select('branding')
      .eq('id', currentWorkspace.id)
      .single()
    const branding = (ws?.branding ?? {}) as Record<string, unknown>
    const channels = (branding.channels ?? {}) as Record<string, unknown>
    connectedChannelIds = new Set(Object.keys(channels))
    const xRaw = channels.x as { handle?: string; connected_at?: string } | undefined
    if (xRaw) xConnection = { handle: xRaw.handle, connectedAt: xRaw.connected_at }
  } catch { /* ignore */ }

  const connectedProviderSet = new Set(keys.map((k) => k.provider))
  const hasUploadPost = publishServices.some((s) => connectedProviderSet.has(s.provider))
  const totalConnected =
    connectedChannelIds.size + (hasUploadPost ? 1 : 0)
  const hasChannel = totalConnected > 0

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#EDE6F5' }}
        >
          <Radio className="h-4 w-4" style={{ color: '#2A1A3D' }} />
        </div>
        <PageHeading
          eyebrow="Settings · Channels"
          title="Where your content goes out."
          body={
            hasChannel
              ? `${totalConnected} destination${totalConnected === 1 ? '' : 's'} connected. Posts go live straight from the Pipeline.`
              : 'Connect a destination so approved posts publish straight from Clipflow. Each platform takes ~30 seconds.'
          }
        />
      </div>

      {searchParams.error ? (
        <FeedbackBanner tone="error">
          <p className="font-semibold text-destructive">Connection failed</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {searchParams.error === 'session_expired'
              ? 'Took too long — click Connect to try again.'
              : searchParams.error === 'auth_cancelled'
                ? 'Sign-in was cancelled — try again when ready.'
                : searchParams.error === 'missing_params'
                  ? 'Something went wrong. Please refresh and try again.'
                  : decodeURIComponent(searchParams.error)}
          </p>
        </FeedbackBanner>
      ) : null}
      {searchParams.connected ? (
        <FeedbackBanner tone="success">
          <p className="font-semibold text-emerald-800">
            {searchParams.connected.replace(/-/g, ' ')} connected
          </p>
          <p className="mt-0.5 text-xs text-emerald-700">
            Approved posts will publish to this channel from now on.
          </p>
        </FeedbackBanner>
      ) : null}

      {!isOwner && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Only workspace owners can manage channels.
        </div>
      )}

      {/* ── Single unified grid ── */}
      <section className="grid gap-3 sm:grid-cols-2">
        {CHANNELS.map((p) => {
          // X gets its own self-contained wizard card (BYO Developer keys).
          if (p.provider === 'byok-keys' && p.id === 'x') {
            return (
              <div key={p.id} className="sm:col-span-2">
                <XConnectCard
                  workspaceId={currentWorkspace.id}
                  isOwner={isOwner}
                  connected={xConnection}
                />
              </div>
            )
          }

          const composioConnected =
            p.provider === 'composio' && connectedChannelIds.has(p.id)
          const uploadPostConnected =
            p.provider === 'upload-post' && hasUploadPost
          const isConnected = composioConnected || uploadPostConnected
          const dimmed = p.provider === 'catalog-wait'

          return (
            <ChannelCard
              key={p.id}
              channel={p}
              isConnected={isConnected}
              uploadPostConnected={uploadPostConnected}
              dimmed={dimmed}
              isOwner={isOwner}
              workspaceId={currentWorkspace.id}
            />
          )
        })}
      </section>

      {/* ── Upload-Post bundle: special wide card with platform strip ── */}
      <section
        id="upload-post-bundle"
        className="channel-target overflow-hidden rounded-3xl border bg-gradient-to-br from-[#EDE6F5] via-[#F8F4FB] to-[#FAF7F2] p-0.5 shadow-sm"
      >
        <div className="rounded-[calc(theme(borderRadius.3xl)-2px)] bg-card p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: 'var(--lv2s-primary, #2A1A3D)' }}
                >
                  <UploadPostLogo size={18} />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="mr-1 inline h-3 w-3" />
                  Bundle aggregator
                </span>
                {hasUploadPost ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    Connected
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-[20px] font-bold leading-tight text-foreground sm:text-[22px]">
                Upload-Post — one key for the four video platforms.
              </h2>
              <p className="mt-1.5 max-w-[460px] text-[13px] leading-relaxed text-muted-foreground">
                Required for TikTok scheduled publishing (their API is whitelisted). Optional shortcut for the other three — Composio direct OAuth above also works.
              </p>

              {/* Stack of covered platforms — real logos, no clip-art */}
              <div className="mt-4 flex items-center gap-2">
                {UP_BUNDLE_PLATFORMS.map((p) => {
                  const Logo = p.Logo
                  return (
                    <span
                      key={p.name}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${p.tile}`}
                      title={p.name}
                      aria-label={p.name}
                    >
                      <Logo size={16} />
                    </span>
                  )
                })}
                <span
                  className="ml-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70"
                >
                  Covered platforms
                </span>
              </div>
            </div>

            {/* Service-card slot lives here on desktop, inline on mobile. */}
            <div className="w-full sm:max-w-[320px]">
              {publishServices.map((spec) => (
                <ServiceCard
                  key={spec.provider}
                  spec={spec}
                  connectedKeys={keysByProvider[spec.provider] ?? []}
                  workspaceId={currentWorkspace.id}
                  isOwner={isOwner}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subtle footnote — explains the "via Upload-Post" links */}
      <p
        className="text-center text-[11px] text-muted-foreground/70"
      >
        <Zap className="mr-1 inline h-3 w-3" />
        Direct OAuth is preferred where possible — fewer moving parts, no third-party invoice.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

function ChannelCard({
  channel: p,
  isConnected,
  uploadPostConnected,
  dimmed,
  isOwner,
  workspaceId,
}: {
  channel: ChannelDef
  isConnected: boolean
  uploadPostConnected: boolean
  dimmed: boolean
  isOwner: boolean
  workspaceId: string
}) {
  const Logo = p.Logo
  return (
    <div
      className={`group relative flex items-start gap-4 rounded-2xl border p-4 transition-all ${
        dimmed
          ? 'border-dashed border-border/60 bg-muted/20'
          : 'border-border/60 bg-card hover:-translate-y-px hover:border-border hover:shadow-md hover:shadow-primary/[0.04]'
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${p.tileBg}`}
        aria-hidden
      >
        <Logo size={22} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-bold text-foreground">{p.name}</p>
          {isConnected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
              Connected
            </span>
          ) : null}
          {p.provider === 'upload-post' && !uploadPostConnected ? (
            <span className="inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-800">
              Bundled
            </span>
          ) : null}
          {dimmed ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              Soon
            </span>
          ) : null}
        </div>

        <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{p.note}</p>

        {/* Instagram eligibility expander */}
        {p.id === 'instagram' && p.warning ? (
          <details className="group/expand mt-2.5 rounded-md bg-amber-50 text-[11px] text-amber-900">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2 py-1.5 font-medium [&::-webkit-details-marker]:hidden">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {p.warning}
              <ChevronDown className="ml-auto h-3 w-3 transition-transform group-open/expand:rotate-180" />
            </summary>
            <div className="space-y-1.5 border-t border-amber-200/70 px-2 py-2 text-amber-800">
              <p>Quick eligibility check:</p>
              <ol className="ml-4 list-decimal space-y-0.5">
                <li>IG account is set to Business or Creator</li>
                <li>Linked to a Facebook Page you admin</li>
                <li>You authorise Meta for the Page + IG during Connect</li>
              </ol>
              <a
                href="https://help.instagram.com/502981923235522"
                target="_blank"
                rel="noreferrer"
                className="inline-block font-semibold underline underline-offset-2"
              >
                Instagram setup guide →
              </a>
            </div>
          </details>
        ) : null}

        {/* "Why isn't this live?" for catalog-wait */}
        {dimmed && p.explainer ? (
          <details className="group/expand mt-2.5 rounded-md bg-background/60 text-[11px] text-muted-foreground ring-1 ring-border/60">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2 py-1.5 font-medium text-foreground [&::-webkit-details-marker]:hidden">
              Why isn’t this live?
              <ChevronDown className="ml-auto h-3 w-3 transition-transform group-open/expand:rotate-180" />
            </summary>
            <div className="border-t border-border/60 px-2 py-2 leading-relaxed">
              {p.explainer}
            </div>
          </details>
        ) : null}
      </div>

      {/* CTA */}
      <div className="flex shrink-0 self-center">
        {p.provider === 'composio' && isOwner && !isConnected ? (
          <Link
            href={`/api/integrations/connect?app=${p.id}&scope=channel&workspace_id=${workspaceId}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-px hover:shadow-md"
          >
            Connect
            <ArrowRight className="h-3 w-3" />
          </Link>
        ) : null}
        {p.provider === 'upload-post' && !uploadPostConnected ? (
          <a
            href="#upload-post-bundle"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[12px] font-semibold text-foreground transition-all hover:-translate-y-px hover:border-border hover:shadow-sm"
          >
            Via bundle
            <ArrowRight className="h-3 w-3" />
          </a>
        ) : null}
      </div>
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
