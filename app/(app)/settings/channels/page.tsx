import Link from 'next/link'
import { cookies } from 'next/headers'
import { AlertTriangle, Check, Clock, Radio } from 'lucide-react'

import { ServiceCard } from '@/components/ai-keys/service-card'
import { SERVICE_DIRECTORY } from '@/components/ai-keys/service-directory'
import { PageHeading } from '@/components/workspace/page-heading'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { createClient } from '@/lib/supabase/server'

interface ComposioChannelDef {
  id: string
  name: string
  letter: string
  iconBg: string
  note: string
  warning?: string
}

// Social channels backed by Composio direct OAuth. Add to this list
// whenever Composio exposes a new app in their catalog — the connect
// flow is shared via /api/integrations/connect?app=<id>&scope=channel.
const COMPOSIO_CHANNELS: ComposioChannelDef[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    letter: 'in',
    iconBg: 'bg-[#0A66C2]',
    note: 'Post drafts to your personal feed the moment you approve them.',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    letter: '𝕏',
    iconBg: 'bg-black',
    note: 'Send single tweets or threads with your clip or link.',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    letter: 'Y',
    iconBg: 'bg-[#FF0000]',
    note: 'Upload Shorts straight to your channel with title + description.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    letter: 'IG',
    iconBg: 'bg-gradient-to-br from-[#FEDA77] via-[#F58529] to-[#8134AF]',
    note: 'Publish Reels to a connected IG account.',
    warning: 'Requires Instagram Business or Creator account linked to a Facebook Page.',
  },
  {
    id: 'facebook',
    name: 'Facebook Pages',
    letter: 'f',
    iconBg: 'bg-[#1877F2]',
    note: 'Push clips and link posts to a Facebook Page you manage.',
  },
]

// Platforms we want but Composio doesn't list yet. Stays as "Soon"
// until they're available (then move into COMPOSIO_CHANNELS).
const COMPOSIO_SOON: Array<Pick<ComposioChannelDef, 'name' | 'letter' | 'iconBg' | 'note'>> = [
  {
    name: 'Threads',
    letter: '@',
    iconBg: 'bg-zinc-900',
    note: 'Meta Threads isn’t in the Composio catalog yet — we’ll add it as soon as it ships.',
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
          <h2 className="text-sm font-bold">Video publishing</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            TikTok, Instagram Reels, YouTube Shorts and LinkedIn — one Upload-Post key covers all four.
          </p>
        </div>
        <div className="space-y-2">
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
      </section>

      {/* ── Direct social OAuth (Composio) ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold">Direct social connections</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            One-click OAuth — no third-party publisher. Posts go from Clipflow straight to the platform.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {COMPOSIO_CHANNELS.map((p) => {
            const isConnected = connectedChannelIds.has(p.id)
            return (
              <div
                key={p.id}
                className="relative flex items-start gap-3 rounded-xl border border-border/60 bg-background p-4 transition-all hover:border-border"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${p.iconBg}`}
                  aria-hidden
                >
                  {p.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{p.name}</p>
                    {isConnected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <Check className="h-2.5 w-2.5" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.note}</p>
                  {p.warning && (
                    <p className="mt-1 inline-flex items-start gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                      <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
                      {p.warning}
                    </p>
                  )}
                </div>
                {isOwner && !isConnected && (
                  <Link
                    href={`/api/integrations/connect?app=${p.id}&scope=channel&workspace_id=${currentWorkspace.id}`}
                    className="self-center rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground transition-all hover:-translate-y-px hover:shadow-sm"
                  >
                    Connect
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Not yet in Composio catalog ── */}
      {COMPOSIO_SOON.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-bold">Not yet available</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Waiting on the upstream catalog — we’ll wire these up as soon as they ship.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {COMPOSIO_SOON.map((p) => (
              <div
                key={p.name}
                className="relative flex items-start gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 p-4"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${p.iconBg}`}
                  aria-hidden
                >
                  {p.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      Soon
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
