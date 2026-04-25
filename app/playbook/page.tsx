import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock, Sparkles } from 'lucide-react'

import { PlaybookShell } from '@/components/playbook/playbook-shell'
import {
  GUIDES,
  GUIDE_CATEGORIES,
  PATHS,
  PATH_ORDER,
} from '@/lib/landing/playbook'

export const metadata: Metadata = {
  title: 'Playbook — operator guides for Clipflow',
  description:
    'Operator-grade workflow guides for Clipflow: Brand Voice training, podcast publishing cadence, hook formulas, agency onboarding. Pick a learning path.',
  alternates: { canonical: 'https://clipflow.to/playbook' },
}

const DIFFICULTY_LABEL = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const

const TONE_GRADIENT: Record<'lime' | 'plum' | 'sand', string> = {
  lime: 'linear-gradient(135deg, #D6FF3E 0%, #F4FFAB 100%)',
  plum: 'linear-gradient(135deg, #2A1A3D 0%, #4A2D6B 100%)',
  sand: 'linear-gradient(135deg, #E5DDCE 0%, #F3EDE3 100%)',
}
const TONE_INK: Record<'lime' | 'plum' | 'sand', string> = {
  lime: '#1a2000',
  plum: '#D6FF3E',
  sand: '#2A1A3D',
}

interface HubProps {
  searchParams: { path?: string; category?: string; difficulty?: string }
}

export default function PlaybookHubPage({ searchParams }: HubProps) {
  const featured = GUIDES[0]!
  const pathQuery = (searchParams.path as keyof typeof PATHS | undefined) ?? null
  const categoryFilter = searchParams.category ?? null
  const difficultyFilter = searchParams.difficulty ?? null
  const activePath = pathQuery && PATHS[pathQuery] ? PATHS[pathQuery] : null
  const allGuides = activePath
    ? activePath.guideIds
        .map((id) => GUIDES.find((g) => g.id === id))
        .filter((g): g is (typeof GUIDES)[number] => Boolean(g))
    : GUIDES

  const filteredGuides = allGuides.filter((g) => {
    if (categoryFilter && g.category !== categoryFilter) return false
    if (difficultyFilter && g.difficulty !== difficultyFilter) return false
    return true
  })

  return (
    <PlaybookShell activePathId={activePath?.id ?? null}>
      <div className="space-y-16 pb-24">
        {/* ── Hero ── */}
        <header>
          <p className="lv2-mono-label mb-3">The Operator Playbook</p>
          <h1
            className="lv2-display text-[44px] leading-[1.02] sm:text-[64px]"
            style={{ color: 'var(--lv2-primary)' }}
          >
            Built by operators,
            <br />
            <em
              className="not-italic"
              style={{
                fontStyle: 'italic',
                color: 'var(--lv2-fg-soft)',
              }}
            >
              not bloggers.
            </em>
          </h1>
          <p
            className="mt-5 max-w-[640px] text-[16.5px] leading-relaxed"
            style={{ color: 'var(--lv2-fg-soft)' }}
          >
            Pick a path that matches where you are. Each path is a hand-ordered
            sequence — read top to bottom and you finish with a working
            content pipeline, not a folder of bookmarks.
          </p>
        </header>

        {/* ── Path picker ── */}
        <section id="paths" className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="lv2-mono-label mb-1.5">Choose your path</p>
              <p
                className="text-[13.5px]"
                style={{ color: 'var(--lv2-muted)' }}
              >
                3 curated routes through the playbook.
              </p>
            </div>
            {activePath ? (
              <Link
                href="/playbook"
                className="lv2-mono text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors hover:text-[var(--lv2-fg)]"
                style={{ color: 'var(--lv2-muted)' }}
              >
                Reset filter →
              </Link>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {PATH_ORDER.map((id) => {
              const p = PATHS[id]
              const isActive = activePath?.id === id
              const totalMin = p.guideIds.reduce(
                (n, gid) => n + (GUIDES.find((g) => g.id === gid)?.readTimeMinutes ?? 0),
                0,
              )
              return (
                <Link
                  key={id}
                  href={isActive ? '/playbook' : `/playbook?path=${id}`}
                  className="group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: TONE_GRADIENT[p.tone],
                    color: TONE_INK[p.tone],
                    border: isActive
                      ? '2px solid var(--lv2-primary)'
                      : '2px solid transparent',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span aria-hidden className="text-[26px]">
                      {p.emoji}
                    </span>
                    <span
                      className="lv2-mono rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                      style={{
                        background:
                          p.tone === 'plum'
                            ? 'rgba(214,255,62,.15)'
                            : 'rgba(42,26,61,.08)',
                      }}
                    >
                      {p.guideIds.length} guides · {totalMin} min
                    </span>
                  </div>
                  <p className="lv2-display mt-5 text-[24px] leading-tight">
                    {p.name}
                  </p>
                  <p
                    className="mt-1.5 text-[12.5px] leading-relaxed"
                    style={{
                      color:
                        p.tone === 'plum'
                          ? 'rgba(255,255,255,.74)'
                          : 'rgba(42,26,61,.7)',
                    }}
                  >
                    {p.pitch}
                  </p>
                  <span className="lv2-mono mt-5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em]">
                    {isActive ? 'Showing' : 'Start path'}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Featured guide (only when no path filter active) ── */}
        {!activePath ? (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--lv2-primary)' }} />
              <p className="lv2-mono-label">Editor&apos;s pick</p>
            </div>
            <Link
              href={`/playbook/${featured.slug}`}
              className="group flex flex-col gap-5 overflow-hidden rounded-3xl border bg-[var(--lv2-card)] p-6 transition-all hover:-translate-y-1 hover:shadow-xl sm:flex-row sm:p-8"
              style={{ borderColor: 'var(--lv2-border)' }}
            >
              <div className="flex shrink-0 items-center justify-center sm:items-start">
                <span
                  className="flex h-20 w-20 items-center justify-center rounded-2xl text-[42px]"
                  style={{
                    background: 'var(--lv2-primary)',
                    color: 'var(--lv2-accent)',
                  }}
                  aria-hidden
                >
                  {featured.emoji}
                </span>
              </div>
              <div className="flex-1">
                <p className="lv2-mono-label mb-2">
                  {GUIDE_CATEGORIES[featured.category].name} ·{' '}
                  {DIFFICULTY_LABEL[featured.difficulty]} · {featured.readTimeMinutes} min
                </p>
                <h2
                  className="lv2-display text-[28px] leading-tight sm:text-[34px]"
                  style={{ color: 'var(--lv2-primary)' }}
                >
                  {featured.title}
                </h2>
                <p
                  className="mt-3 text-[14.5px] leading-relaxed"
                  style={{ color: 'var(--lv2-fg-soft)' }}
                >
                  {featured.subtitle}
                </p>
                <span
                  className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold"
                  style={{ color: 'var(--lv2-primary)' }}
                >
                  Read guide
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        {/* ── All guides + filters ── */}
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="lv2-mono-label mb-1">
                {activePath ? `${activePath.name} · path` : 'All guides'}
              </p>
              <p
                className="text-[13.5px]"
                style={{ color: 'var(--lv2-muted)' }}
              >
                {filteredGuides.length}{' '}
                {filteredGuides.length === 1 ? 'guide' : 'guides'}
                {categoryFilter || difficultyFilter ? ' · filtered' : ''}
              </p>
            </div>
            <FilterBar
              activePathId={activePath?.id ?? null}
              activeCategory={categoryFilter}
              activeDifficulty={difficultyFilter}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredGuides.map((g, i) => (
              <Link
                key={g.id}
                href={
                  activePath
                    ? `/playbook/${g.slug}?path=${activePath.id}`
                    : `/playbook/${g.slug}`
                }
                className="group flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{
                  background: 'var(--lv2-card)',
                  border: '1px solid var(--lv2-border)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[20px]"
                    style={{ background: 'var(--lv2-primary-soft)' }}
                    aria-hidden
                  >
                    {g.emoji}
                  </span>
                  {activePath ? (
                    <span
                      className="lv2-mono flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{
                        background: 'var(--lv2-primary)',
                        color: 'var(--lv2-accent)',
                      }}
                      aria-label={`Step ${i + 1}`}
                    >
                      {i + 1}
                    </span>
                  ) : (
                    <span
                      className="lv2-mono flex items-center gap-1 text-[10.5px] uppercase tracking-[0.08em]"
                      style={{ color: 'var(--lv2-muted)' }}
                    >
                      <Clock className="h-3 w-3" />
                      {g.readTimeMinutes} min
                    </span>
                  )}
                </div>
                <h3
                  className="lv2-display mt-4 text-[20px] leading-tight"
                  style={{ color: 'var(--lv2-primary)' }}
                >
                  {g.title}
                </h3>
                <p
                  className="mt-1.5 flex-1 text-[13px] leading-relaxed"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  {g.subtitle}
                </p>
                <div
                  className="mt-4 flex items-center justify-between text-[11.5px] font-semibold"
                  style={{ color: 'var(--lv2-primary)' }}
                >
                  <span
                    className="lv2-mono rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]"
                    style={{
                      background: 'var(--lv2-bg-2)',
                      color: 'var(--lv2-muted)',
                    }}
                  >
                    {DIFFICULTY_LABEL[g.difficulty]}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    Read
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PlaybookShell>
  )
}

// ---------------------------------------------------------------------------

function FilterBar({
  activePathId,
  activeCategory,
  activeDifficulty,
}: {
  activePathId: string | null
  activeCategory: string | null
  activeDifficulty: string | null
}) {
  function buildHref(over: { category?: string; difficulty?: string }) {
    const params = new URLSearchParams()
    if (activePathId) params.set('path', activePathId)
    const cat = over.category !== undefined ? over.category : activeCategory
    const diff = over.difficulty !== undefined ? over.difficulty : activeDifficulty
    if (cat) params.set('category', cat)
    if (diff) params.set('difficulty', diff)
    const qs = params.toString()
    return qs ? `/playbook?${qs}` : '/playbook'
  }

  const cats = Object.values(GUIDE_CATEGORIES)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(['beginner', 'intermediate', 'advanced'] as const).map((d) => {
        const isActive = activeDifficulty === d
        return (
          <Link
            key={d}
            href={buildHref({ difficulty: isActive ? '' : d })}
            className="lv2-mono rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] transition-all"
            style={{
              borderColor: isActive ? 'var(--lv2-primary)' : 'var(--lv2-border)',
              background: isActive ? 'var(--lv2-primary)' : 'transparent',
              color: isActive ? 'var(--lv2-accent)' : 'var(--lv2-muted)',
            }}
          >
            {DIFFICULTY_LABEL[d]}
          </Link>
        )
      })}
      <span aria-hidden className="mx-1 inline-block h-3 w-px" style={{ background: 'var(--lv2-border)' }} />
      {cats.map((c) => {
        const isActive = activeCategory === c.id
        return (
          <Link
            key={c.id}
            href={buildHref({ category: isActive ? '' : c.id })}
            className="lv2-mono rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] transition-all"
            style={{
              borderColor: isActive ? 'var(--lv2-primary)' : 'var(--lv2-border)',
              background: isActive ? 'var(--lv2-primary-soft)' : 'transparent',
              color: isActive ? 'var(--lv2-primary)' : 'var(--lv2-muted)',
            }}
          >
            <span aria-hidden className="mr-0.5">{c.emoji}</span>
            {c.name}
          </Link>
        )
      })}
    </div>
  )
}
