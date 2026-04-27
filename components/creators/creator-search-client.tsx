'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import {
  ArrowRight,
  Compass,
  ExternalLink,
  Radar,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  InstagramLogo,
  LinkedInLogo,
  TikTokLogo,
  XLogo,
  YouTubeLogo,
} from '@/components/brand-logos'
import { searchCreatorsAction } from '@/app/(app)/workspace/[id]/research/actions'

interface CreatorSearchClientProps {
  workspaceId: string
}

interface PlatformDef {
  id: string
  name: string
  Logo: (props: { size?: number; className?: string }) => ReactNode
  /** Brand tile background — used on the platform pill icon + result corner badge. */
  tileBg: string
  /** Foreground for the brand tile (the SVG fill). */
  tileFg: string
  /** Mono prefix label above the search input. */
  inputPrefix: string
  inputHint: string
  exampleChips: string[]
  /** Editorial footnote shown under the search panel. */
  apiNote: string
}

const PLATFORMS: PlatformDef[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    Logo: YouTubeLogo,
    tileBg: 'bg-[#FF0000]',
    tileFg: 'text-white',
    inputPrefix: 'Niche',
    inputHint: 'fitness · SaaS marketing · finance tips',
    exampleChips: ['fitness', 'SaaS marketing', 'finance tips', 'video editing'],
    apiNote: 'Channel search via the official YouTube Data API · free, unlimited',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    Logo: TikTokLogo,
    tileBg: 'bg-black',
    tileFg: 'text-white',
    inputPrefix: 'Query',
    inputHint: '@charlidamelio · or a keyword like "dance"',
    exampleChips: ['@charlidamelio', '@khaby.lame', 'recipes', 'dance'],
    apiNote: 'Profile lookup or keyword search via ScrapeCreators',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    Logo: InstagramLogo,
    tileBg: 'bg-gradient-to-br from-[#FEDA77] via-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    tileFg: 'text-white',
    inputPrefix: 'Handle',
    inputHint: '@cristiano',
    exampleChips: ['@cristiano', '@zendaya', '@therock', '@selenagomez'],
    apiNote: 'Profile lookup by @handle via ScrapeCreators',
  },
  {
    id: 'twitter',
    name: 'X',
    Logo: XLogo,
    tileBg: 'bg-black',
    tileFg: 'text-white',
    inputPrefix: 'Handle',
    inputHint: '@elonmusk',
    exampleChips: ['@elonmusk', '@paulg', '@naval', '@sama'],
    apiNote: 'Profile lookup by @handle via ScrapeCreators',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    Logo: LinkedInLogo,
    tileBg: 'bg-[#0A66C2]',
    tileFg: 'text-white',
    inputPrefix: 'URL',
    inputHint: 'linkedin.com/in/williamhgates',
    exampleChips: [],
    apiNote: 'Profile lookup by URL via ScrapeCreators',
  },
]

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-foreground px-4 text-[13px] font-bold text-background shadow-sm shadow-foreground/[0.18] transition-all hover:-translate-y-px hover:shadow-md hover:shadow-foreground/[0.28] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
    >
      <Search className="h-3.5 w-3.5" />
      {pending ? 'Searching…' : 'Search'}
      <kbd className="ml-0.5 hidden h-4 items-center rounded border border-white/20 bg-white/10 px-1 font-mono text-[10px] font-bold sm:inline-flex">
        ⏎
      </kbd>
    </button>
  )
}

export function CreatorSearchClient({ workspaceId: _workspaceId }: CreatorSearchClientProps) {
  const [state, formAction] = useFormState(searchCreatorsAction, {})
  const [platformId, setPlatformId] = useState('youtube')
  const [query, setQuery] = useState('')

  const platform = PLATFORMS.find((p) => p.id === platformId)!
  const results = state.ok === true
    ? (state.results as { platform: string; creators: Array<Record<string, unknown>> })
    : null
  const hasSubmitted = state.ok !== undefined

  return (
    <div className="space-y-9">
      {/* ── 01 · Source ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader index="01" icon={<Radar className="h-3.5 w-3.5" />} title="Source" hint="Pick the platform, then narrow the search to a niche, handle, or keyword." />

        <form
          action={formAction}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 sm:p-6"
          style={{
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(42,26,61,0.04), 0 12px 32px -18px rgba(42,26,61,0.18)',
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          />
          <input type="hidden" name="platform" value={platformId} />

          {/* Platform pills with real brand logos */}
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map((p) => {
              const Logo = p.Logo
              const isActive = p.id === platformId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPlatformId(p.id)
                    setQuery('')
                  }}
                  className={`group relative inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                    isActive
                      ? 'bg-foreground text-background shadow-sm shadow-foreground/20'
                      : 'border border-border/60 bg-background text-muted-foreground hover:-translate-y-px hover:border-foreground/20 hover:text-foreground hover:shadow-sm'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md ${p.tileBg} ${p.tileFg} ${
                      isActive ? '' : 'opacity-90 group-hover:opacity-100'
                    } transition-opacity`}
                    aria-hidden
                  >
                    <Logo size={13} />
                  </span>
                  {p.name}
                </button>
              )
            })}
          </div>

          {/* Query input — taller, premium chrome */}
          <div className="mt-5">
            <label className="block">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/75"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <span className="inline-block h-px w-4 bg-primary/40" />
                {platform.inputPrefix}
              </span>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    name="query"
                    type="text"
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={platform.inputHint}
                    className="h-11 w-full rounded-xl border border-border/70 bg-background pl-9 pr-3 text-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] placeholder:text-muted-foreground/55 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                <SubmitButton />
              </div>
            </label>
          </div>

          {/* Example chips */}
          {platform.exampleChips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/65"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                <Sparkles className="h-2.5 w-2.5 text-primary/60" />
                Try
              </span>
              {platform.exampleChips.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQuery(s)}
                  className="rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-all hover:-translate-y-px hover:border-primary/40 hover:bg-primary/[0.05] hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* API footnote */}
          <p
            className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <span className="text-primary/40">↳</span> {platform.apiNote}
          </p>
        </form>
      </section>

      {/* Error banner */}
      {state.ok === false && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            !
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-destructive">Search failed</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {(state as { error: string }).error}
            </p>
          </div>
        </div>
      )}

      {/* ── 02 · Results / Discoverable ─────────────────────────── */}
      {results ? (
        <section className="space-y-4">
          <SectionHeader
            index="02"
            icon={<Compass className="h-3.5 w-3.5" />}
            title="Results"
            hint={`${results.creators.length} creator${results.creators.length === 1 ? '' : 's'} matched on ${platform.name}`}
          />

          {results.creators.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-12 text-center">
              <p className="text-sm font-semibold text-foreground">No creators matched.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a broader keyword or switch platform.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.creators.map((creator, i) => (
                <CreatorCard
                  key={i}
                  creator={creator}
                  platform={
                    PLATFORMS.find((p) => p.id === results.platform) ?? platform
                  }
                />
              ))}
            </div>
          )}
        </section>
      ) : !hasSubmitted ? (
        <DiscoverPanel
          activeId={platformId}
          onPlatformSelect={(id) => {
            setPlatformId(id)
            setQuery('')
          }}
        />
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function SectionHeader({
  index,
  icon,
  title,
  hint,
}: {
  index: string
  icon?: ReactNode
  title: string
  hint?: string
}) {
  return (
    <header className="space-y-1">
      <p
        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/75"
        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
      >
        <span className="inline-block h-px w-5 bg-primary/40" />
        {index}
        <span className="text-primary/30">·</span>
        <span className="text-muted-foreground/70">section</span>
      </p>
      <div className="flex items-center gap-2.5">
        {icon ? (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/[0.09] text-primary">
            {icon}
          </span>
        ) : null}
        <h2
          className="text-[20px] font-bold leading-tight tracking-tight text-foreground sm:text-[22px]"
          style={{ fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif' }}
        >
          {title}
        </h2>
      </div>
      {hint ? (
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </header>
  )
}

function DiscoverPanel({
  activeId,
  onPlatformSelect,
}: {
  activeId: string
  onPlatformSelect: (id: string) => void
}) {
  return (
    <section className="space-y-4">
      <SectionHeader
        index="02"
        icon={<Compass className="h-3.5 w-3.5" />}
        title="Discoverable"
        hint="Five sources, one search. Pick a platform to scope the next query."
      />
      <div
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-card"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(42,26,61,0.04), 0 12px 32px -18px rgba(42,26,61,0.18)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        />
        {PLATFORMS.map((p, i) => {
          const Logo = p.Logo
          const isActive = p.id === activeId
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPlatformSelect(p.id)}
              className={`group relative flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-primary/[0.025] sm:px-6 sm:py-5 ${
                i > 0 ? 'border-t border-border/60' : ''
              } ${isActive ? 'bg-primary/[0.04]' : ''}`}
            >
              {/* hairline accent that fades in on hover or when active */}
              <span
                aria-hidden
                className={`pointer-events-none absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 bg-primary transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'
                }`}
              />
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${p.tileBg} ${p.tileFg}`}
                aria-hidden
                style={{
                  boxShadow:
                    '0 1px 0 rgba(255,255,255,0.16) inset, 0 8px 22px -10px rgba(0,0,0,0.4)',
                }}
              >
                <Logo size={17} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <p
                  className="text-[14px] font-bold tracking-tight text-foreground"
                  style={{
                    fontFamily:
                      'var(--font-inter-tight), var(--font-inter), sans-serif',
                  }}
                >
                  {p.name}
                </p>
                <p className="truncate text-[12.5px] leading-relaxed text-muted-foreground">
                  {p.apiNote}
                </p>
              </div>
              <span
                className="hidden items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/85 transition-colors group-hover:border-primary/30 group-hover:text-primary sm:inline-flex"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                {p.inputPrefix}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          )
        })}
      </div>
    </section>
  )
}

function CreatorCard({
  creator,
  platform,
}: {
  creator: Record<string, unknown>
  platform: PlatformDef
}) {
  const Logo = platform.Logo
  const name = (creator.name ?? creator.displayName ?? creator.username ?? 'Unknown') as string
  const handle = (creator.username ?? creator.handle) as string | undefined
  const thumbnail = (creator.thumbnail ?? creator.avatar ?? null) as string | null
  const subscribers = (creator.subscriberCount ?? creator.followers ?? 0) as number
  const videos = (creator.videoCount ?? creator.posts ?? 0) as number
  const views = (creator.viewCount ?? creator.likes ?? 0) as number
  const bio = (creator.description ?? creator.bio ?? '') as string
  const channelId = creator.channelId as string | undefined

  const profileUrl =
    platform.id === 'youtube' && channelId
      ? `https://youtube.com/channel/${channelId}`
      : platform.id === 'tiktok' && handle
        ? `https://tiktok.com/@${handle}`
        : platform.id === 'instagram' && handle
          ? `https://instagram.com/${handle}`
          : platform.id === 'twitter' && handle
            ? `https://x.com/${handle}`
            : platform.id === 'linkedin' && (creator.profileUrl as string)
              ? (creator.profileUrl as string)
              : null

  const labelLeft = platform.id === 'youtube' ? 'Subs' : 'Followers'
  const labelMid = platform.id === 'youtube' ? 'Videos' : 'Posts'
  const labelRight = platform.id === 'youtube' ? 'Views' : 'Likes'

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-px hover:border-border hover:shadow-md hover:shadow-primary/[0.05]"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04)',
      }}
    >
      {/* Brand corner badge — clearly tags the platform */}
      <span
        className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md shadow-sm ${platform.tileBg} ${platform.tileFg}`}
        aria-label={`Platform: ${platform.name}`}
      >
        <Logo size={11} />
      </span>

      {/* Avatar + name */}
      <div className="flex items-start gap-3 pr-7">
        <div className="shrink-0">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={name}
              width={44}
              height={44}
              unoptimized
              className="h-11 w-11 rounded-full object-cover ring-2 ring-background"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted ring-2 ring-background">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[13.5px] font-bold tracking-tight text-foreground"
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            {name}
          </p>
          {handle ? (
            <p className="truncate font-mono text-[11px] text-muted-foreground">@{handle}</p>
          ) : null}
        </div>
      </div>

      {bio ? (
        <p className="mt-2.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
          {bio}
        </p>
      ) : null}

      {/* Stats — data-sheet feel: mono nums, hairline dividers, micro labels */}
      <div className="mt-4 grid grid-cols-3 divide-x divide-border/50 rounded-xl border border-border/40 bg-muted/30">
        <Stat label={labelLeft} value={formatCount(subscribers)} />
        <Stat label={labelMid} value={formatCount(videos)} />
        <Stat label={labelRight} value={formatCount(views)} />
      </div>

      {/* Action */}
      {profileUrl ? (
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[12px] font-bold text-foreground transition-all hover:-translate-y-px hover:border-foreground/30 hover:shadow-sm"
        >
          Open on {platform.name}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-1 py-2">
      <p className="font-mono text-[13px] font-bold tabular-nums text-foreground">{value}</p>
      <p className="font-bold text-[9px] font-bold uppercase tracking-[0.16em] text-primary/85">
        {label}
      </p>
    </div>
  )
}
