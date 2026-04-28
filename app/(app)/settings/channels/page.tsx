import Link from 'next/link'
import { cookies } from 'next/headers'
import { AlertTriangle, ArrowRight, Check, ChevronDown, Clock, Radio, Sparkles } from 'lucide-react'

import { SERVICE_DIRECTORY } from '@/components/ai-keys/service-directory'
import { UploadPostConnectSlot } from '@/components/channels/upload-post-connect-slot'
import { SettingsHero } from '@/components/settings/settings-hero'
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
  tileBg: string
  Logo: (props: { size?: number; className?: string }) => ReactNode
  note: string
  warning?: string
  explainer?: string
}

const DIRECT_CHANNELS: ChannelDef[] = [
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
]

const SOON_CHANNELS: ChannelDef[] = [
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

  // Total connection count for the hero status pill — includes the
  // four direct OAuth channels, Upload-Post if connected, and the
  // X bring-your-own-keys connection. Reads as "X of 6 wired".
  const totalChannels = DIRECT_CHANNELS.length + 1 /* Upload-Post */ + 1 /* X */
  const connectedCount =
    connectedChannelIds.size + (hasUploadPost ? 1 : 0) + (xConnection ? 1 : 0)
  const allConnected = connectedCount === totalChannels

  return (
    <div className="space-y-8">
      <SettingsHero
        visual={
          <span
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white sm:h-16 sm:w-16"
            style={{
              background:
                'linear-gradient(140deg, #2A1A3D 0%, #120920 60%, #2A1A3D 100%)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.18) inset, 0 10px 24px -12px rgba(42,26,61,0.55)',
            }}
            aria-hidden
          >
            <span
              className="pointer-events-none absolute inset-1 rounded-[14px]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
              }}
            />
            <Radio className="relative h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.6} />
          </span>
        }
        eyebrow={`${currentWorkspace.name} · Channels`}
        title="Where your posts go live."
        body={
          connectedCount === 0
            ? 'Wire up the platforms you publish to. Approved drafts ship straight to the destinations you connect — no copy-paste, no Buffer middleman.'
            : `${connectedCount} of ${totalChannels} destinations wired. Approved drafts publish straight to the connected ones.`
        }
        action={
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em]"
            style={{
              background: allConnected
                ? 'rgba(15,107,77,.12)'
                : connectedCount > 0
                  ? 'rgba(214,255,62,.18)'
                  : 'rgba(42,26,61,.06)',
              color: allConnected
                ? '#0F6B4D'
                : connectedCount > 0
                  ? '#1a2000'
                  : '#5f5850',
              border: `1px solid ${
                allConnected
                  ? 'rgba(15,107,77,.25)'
                  : connectedCount > 0
                    ? 'rgba(214,255,62,.40)'
                    : 'rgba(42,26,61,.12)'
              }`,
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: allConnected
                  ? '#0F6B4D'
                  : connectedCount > 0
                    ? '#D6FF3E'
                    : '#7c7468',
                boxShadow:
                  connectedCount > 0
                    ? '0 0 8px rgba(214,255,62,.7)'
                    : 'none',
              }}
            />
            {allConnected
              ? 'All wired'
              : connectedCount > 0
                ? `${connectedCount}/${totalChannels} live`
                : 'Nothing wired'}
          </span>
        }
      />

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

      {/* ── 01 · Direct connect ──────────────────────────────────── */}
      <section className="space-y-3">
        <SectionLabel num="01">
          Direct connect
          <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/70">
            OAuth via Composio · 4 destinations
          </span>
        </SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {DIRECT_CHANNELS.map((c) => {
            const isConnected = connectedChannelIds.has(c.id)
            return (
              <ChannelCard
                key={c.id}
                channel={c}
                isConnected={isConnected}
                isOwner={isOwner}
                workspaceId={currentWorkspace.id}
              />
            )
          })}
        </div>
      </section>

      {/* ── 02 · Bundle aggregator (Upload-Post) ─────────────────── */}
      <section className="space-y-3" id="upload-post-bundle">
        <SectionLabel num="02">
          Bundle aggregator
          <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/70">
            required for TikTok scheduled publishing
          </span>
        </SectionLabel>

        <UploadPostBundleCard
          isOwner={isOwner}
          isConnected={hasUploadPost}
          workspaceId={currentWorkspace.id}
          publishServices={publishServices}
          keysByProvider={keysByProvider}
        />
      </section>

      {/* ── 03 · Bring your own keys (X) ─────────────────────────── */}
      <section className="space-y-3">
        <SectionLabel num="03">
          Bring your own keys
          <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/70">
            X (Twitter) · free tier ~1.5k tweets/month
          </span>
        </SectionLabel>
        <XConnectCard
          workspaceId={currentWorkspace.id}
          isOwner={isOwner}
          connected={xConnection}
        />
      </section>

      {/* ── Catalog-wait (Threads etc.) ──────────────────────────── */}
      {SOON_CHANNELS.length > 0 && (
        <section className="space-y-3">
          <SectionLabel num="·" muted>
            Not in the Composio catalog yet
            <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/70">
              {SOON_CHANNELS.length} platform{SOON_CHANNELS.length === 1 ? '' : 's'}
            </span>
          </SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOON_CHANNELS.map((c) => (
              <ChannelCard
                key={c.id}
                channel={c}
                isConnected={false}
                isOwner={isOwner}
                workspaceId={currentWorkspace.id}
                dimmed
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function SectionLabel({
  num,
  children,
  muted,
}: {
  num: string
  children: ReactNode
  muted?: boolean
}) {
  return (
    <p
      className={`inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em] ${
        muted ? 'text-muted-foreground/75' : 'text-primary/85'
      }`}
      style={{
        fontFamily:
          'var(--font-inter-tight), var(--font-inter), sans-serif',
      }}
    >
      <span
        aria-hidden
        className={`inline-block h-px w-5 ${muted ? 'bg-muted-foreground/35' : 'bg-primary/40'}`}
      />
      <span className={muted ? 'text-muted-foreground/65' : 'text-primary'}>{num}</span>
      <span className={muted ? 'text-muted-foreground/40' : 'text-primary/35'}>·</span>
      {children}
    </p>
  )
}

function ChannelCard({
  channel: p,
  isConnected,
  isOwner,
  workspaceId,
  dimmed = false,
}: {
  channel: ChannelDef
  isConnected: boolean
  isOwner: boolean
  workspaceId: string
  dimmed?: boolean
}) {
  const Logo = p.Logo
  return (
    <div
      className={`group relative flex flex-col rounded-2xl border p-4 transition-all ${
        dimmed
          ? 'border-dashed border-border/60 bg-muted/20'
          : isConnected
            ? 'border-emerald-200/70 bg-emerald-50/30'
            : 'border-border/60 bg-card hover:-translate-y-px hover:border-border hover:shadow-md hover:shadow-primary/[0.04]'
      }`}
    >
      <div className="flex items-start gap-3">
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
            {dimmed ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                Soon
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
            {p.note}
          </p>
        </div>

        {/* Right-side action — uniform slot, always shows something */}
        <div className="flex shrink-0 self-center">
          {p.provider === 'composio' && isOwner && !isConnected ? (
            <Link
              href={`/api/integrations/connect?app=${p.id}&scope=channel&workspace_id=${workspaceId}`}
              className="cf-btn-3d cf-btn-3d-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px]"
            >
              Connect
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : null}
          {dimmed ? (
            <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/75">
              Auto-enable
            </span>
          ) : null}
        </div>
      </div>

      {/* Inline expanders — pushed to footer so card heights stay closer */}
      {p.id === 'instagram' && p.warning ? (
        <details className="group/expand mt-3 rounded-md bg-amber-50 text-[11px] text-amber-900">
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

      {dimmed && p.explainer ? (
        <details className="group/expand mt-3 rounded-md bg-background/60 text-[11px] text-muted-foreground ring-1 ring-border/60">
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
  )
}

function UploadPostBundleCard({
  isOwner,
  isConnected,
  workspaceId,
  publishServices,
  keysByProvider,
}: {
  isOwner: boolean
  isConnected: boolean
  workspaceId: string
  publishServices: typeof SERVICE_DIRECTORY
  keysByProvider: Record<string, ReturnType<typeof Object.values>>
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm shadow-primary/[0.02]">
      <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
        {/* Left column — info */}
        <div className="flex flex-col gap-4 border-b border-border/40 p-5 sm:border-b-0 sm:border-r sm:p-6">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ background: '#2A1A3D' }}
              aria-hidden
            >
              <UploadPostLogo size={18} />
            </span>
            <div>
              <p className="text-[14.5px] font-bold text-foreground">Upload-Post</p>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85">
                One key · four video platforms
              </p>
            </div>
            {isConnected ? (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
                Connected
              </span>
            ) : null}
          </div>

          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Required for TikTok scheduled publishing — TikTok&apos;s API is whitelisted, so we route through Upload-Post. Optional shortcut for the other three platforms below — direct OAuth in Section 01 also works.
          </p>

          {/* Covered platforms strip — clearly delineated, mono label */}
          <div className="rounded-xl border border-border/40 bg-muted/30 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/75">
              Covered platforms
            </p>
            <div className="mt-2 flex items-center gap-2">
              {UP_BUNDLE_PLATFORMS.map((p) => {
                const Logo = p.Logo
                return (
                  <span
                    key={p.name}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm ${p.tile}`}
                    title={p.name}
                    aria-label={p.name}
                  >
                    <Logo size={16} />
                  </span>
                )
              })}
            </div>
          </div>

          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/75">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Free tier · 10 posts/mo, 2 profiles · upgrade from $16/mo
          </p>
        </div>

        {/* Right column — connect slot. Minimal — every word of marketing
            copy already lives in the left column, so this only carries
            the connection mechanics (button, key list, "get your key"). */}
        <div className="flex w-full flex-col justify-center p-5 sm:w-[260px] sm:p-6">
          {publishServices.map((spec) => (
            <UploadPostConnectSlot
              key={spec.provider}
              spec={spec}
              connectedKeys={(keysByProvider[spec.provider] as never) ?? []}
              workspaceId={workspaceId}
              isOwner={isOwner}
            />
          ))}
        </div>
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
