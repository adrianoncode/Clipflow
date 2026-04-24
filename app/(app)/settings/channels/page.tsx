import Link from 'next/link'
import { cookies } from 'next/headers'
import { AlertTriangle, Check, ChevronDown, Clock, Radio } from 'lucide-react'

import { ServiceCard } from '@/components/ai-keys/service-card'
import { SERVICE_DIRECTORY } from '@/components/ai-keys/service-directory'
import { PageHeading } from '@/components/workspace/page-heading'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { createClient } from '@/lib/supabase/server'

import { XConnectCard } from '@/components/channels/x-connect-card'

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
  letter: string
  iconBg: string
  note: string
  provider: ChannelProvider
  /** Shown below the main note only for providers that need extra care. */
  warning?: string
  /** Only shown on expanded "Why?" for byok-future / catalog-wait cards. */
  explainer?: string
}

const CHANNELS: ChannelDef[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    letter: 'in',
    iconBg: 'bg-[#0A66C2]',
    provider: 'composio',
    note: 'Post drafts to your personal feed the moment you approve them.',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    letter: 'Y',
    iconBg: 'bg-[#FF0000]',
    provider: 'composio',
    note: 'Upload Shorts straight to your channel with title + description.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    letter: 'IG',
    iconBg: 'bg-gradient-to-br from-[#FEDA77] via-[#F58529] to-[#8134AF]',
    provider: 'composio',
    note: 'Publish Reels to a connected IG account.',
    warning: 'Needs a Business/Creator account linked to a Facebook Page.',
  },
  {
    id: 'facebook',
    name: 'Facebook Pages',
    letter: 'f',
    iconBg: 'bg-[#1877F2]',
    provider: 'composio',
    note: 'Push clips and link posts to a Facebook Page you manage.',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    letter: 'T',
    iconBg: 'bg-black',
    provider: 'upload-post',
    note: 'Routed through the Upload-Post bundle (one key, four platforms).',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    letter: '𝕏',
    iconBg: 'bg-black',
    provider: 'byok-keys',
    note: 'Bring your own X Developer app (Free tier: ~1.5k tweets/month).',
  },
  {
    id: 'threads',
    name: 'Threads',
    letter: '@',
    iconBg: 'bg-zinc-900',
    provider: 'catalog-wait',
    note: 'Meta Threads isn’t in the Composio catalog yet.',
    explainer:
      'Threads opened its publishing API in 2024 but Composio hasn’t wrapped it. We’ll enable this card the day it ships — no action needed from you.',
  },
]

export const metadata = {
  title: 'Channels',
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

/**
 * Channels — social publishing destinations.
 *
 * This used to live at /settings/ai-keys alongside OpenAI/Anthropic/etc.
 * but that mixed two mental models: "AI providers that generate content"
 * with "publishing destinations that send it out." Creators searching
 * for "where do I connect my TikTok?" found that confusing, so we split
 * the publishing services (currently Upload-Post) out into their own
 * page here.
 *
 * Anything under SERVICE_DIRECTORY with `category: 'publish'` shows up
 * here — AI Keys filters them out correspondingly.
 */
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

  // Which Composio channels are already connected? Read from branding.channels,
  // not branding.integrations — keeps the two scopes cleanly separated.
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
    if (xRaw) {
      xConnection = { handle: xRaw.handle, connectedAt: xRaw.connected_at }
    }
  } catch { /* ignore */ }

  const connectedProviderSet = new Set(keys.map((k) => k.provider))
  const hasUploadPost = publishServices.some((s) => connectedProviderSet.has(s.provider))
  const hasChannel = hasUploadPost || connectedChannelIds.size > 0

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
          body="Channels are the social destinations Clipflow publishes to. Video-heavy platforms (TikTok, Instagram Reels, YouTube Shorts, LinkedIn) route through Upload-Post today — one key, all four. Text-and-link platforms ship next via direct OAuth."
        />
      </div>

      {searchParams.error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">!</span>
          <div>
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
          </div>
        </div>
      )}
      {searchParams.connected && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-3 w-3 text-white" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800">
              {searchParams.connected.replace(/-/g, ' ')} connected
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              You can now publish to this channel from inside Clipflow.
            </p>
          </div>
        </div>
      )}

      {!hasChannel && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-amber-900">
              No channels connected yet.
            </p>
            <p className="mt-0.5 text-amber-700">
              Connect a direct social OAuth below, or use Upload-Post for the
              TikTok/Reels/Shorts/LinkedIn video bundle.
            </p>
          </div>
        </div>
      )}

      {!isOwner && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Only workspace owners can manage channels.
        </div>
      )}

      {/* ── Video publishing (Upload-Post bundle) ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold">Video publishing (Upload-Post)</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            One key unlocks scheduled posting to TikTok, IG Reels, YouTube Shorts and LinkedIn. Only required if you use the TikTok destination (or want the bundle).
          </p>
        </div>
        <div className="space-y-2">
          {publishServices.map((spec) => (
            <div
              key={spec.provider}
              id={spec.provider === 'upload-post' ? 'upload-post-bundle' : undefined}
              className={spec.provider === 'upload-post' ? 'channel-target' : undefined}
            >
              <ServiceCard
                spec={spec}
                connectedKeys={keysByProvider[spec.provider] ?? []}
                workspaceId={currentWorkspace.id}
                isOwner={isOwner}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── All social destinations ── */}
      <section className="space-y-3" id="channels-grid">
        <div>
          <h2 className="text-sm font-bold">All destinations</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every platform Clipflow can reach, with its connection path. Composio = direct OAuth. Upload-Post = video bundle above.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {CHANNELS.map((p) => {
            // X gets its own self-contained wizard card. Span the full
            // grid row so the accordion has room to breathe.
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
              <div
                key={p.id}
                className={`relative flex items-start gap-3 rounded-xl border p-4 transition-all ${
                  dimmed
                    ? 'border-dashed border-border/60 bg-muted/20'
                    : 'border-border/60 bg-background hover:border-border'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${p.iconBg}`}
                  aria-hidden
                >
                  {p.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{p.name}</p>
                    {isConnected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <Check className="h-2.5 w-2.5" />
                        Connected
                      </span>
                    )}
                    {p.provider === 'upload-post' && !uploadPostConnected && (
                      <span className="inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-800">
                        Bundled via Upload-Post
                      </span>
                    )}
                    {dimmed && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        Not live
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.note}</p>

                  {/* Instagram: inline "Am I eligible?" pre-check expander. */}
                  {p.id === 'instagram' && p.warning && (
                    <details className="group mt-2 rounded-md bg-amber-50 text-[11px] text-amber-900">
                      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2 py-1.5 font-medium [&::-webkit-details-marker]:hidden">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {p.warning}
                        <ChevronDown className="ml-auto h-3 w-3 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="space-y-1.5 border-t border-amber-200/70 px-2 py-2 text-amber-800">
                        <p>Quick eligibility check:</p>
                        <ol className="ml-4 list-decimal space-y-0.5">
                          <li>Your IG account is set to Business or Creator (Settings → Account type)</li>
                          <li>It’s linked to a Facebook Page you admin</li>
                          <li>You’ll authorise Meta for the FB Page + IG account during Connect</li>
                        </ol>
                        <a
                          href="https://help.instagram.com/502981923235522"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block font-semibold underline underline-offset-2"
                        >
                          Instagram guide →
                        </a>
                      </div>
                    </details>
                  )}

                  {/* byok-future / catalog-wait: "Why isn't this live?" drawer. */}
                  {dimmed && p.explainer && (
                    <details className="group mt-2 rounded-md bg-background/60 text-[11px] text-muted-foreground ring-1 ring-border/60">
                      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2 py-1.5 font-medium text-foreground [&::-webkit-details-marker]:hidden">
                        Why isn’t this live?
                        <ChevronDown className="ml-auto h-3 w-3 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="border-t border-border/60 px-2 py-2 leading-relaxed">
                        {p.explainer}
                      </div>
                    </details>
                  )}
                </div>

                {/* Right-side CTA — depends on provider + connection state. */}
                <div className="flex shrink-0 self-center">
                  {/* Composio + not connected → OAuth Connect */}
                  {p.provider === 'composio' && isOwner && !isConnected && (
                    <Link
                      href={`/api/integrations/connect?app=${p.id}&scope=channel&workspace_id=${currentWorkspace.id}`}
                      className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground transition-all hover:-translate-y-px hover:shadow-sm"
                    >
                      Connect
                    </Link>
                  )}
                  {/* Upload-Post + not connected → scroll to UP card above */}
                  {p.provider === 'upload-post' && !uploadPostConnected && (
                    <a
                      href="#upload-post-bundle"
                      className="rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[12px] font-semibold text-foreground transition-all hover:-translate-y-px hover:shadow-sm"
                    >
                      Via Upload-Post ↑
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
