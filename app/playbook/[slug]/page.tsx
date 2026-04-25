import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, Compass } from 'lucide-react'

import { PlaybookShell } from '@/components/playbook/playbook-shell'
import { PlaybookSection } from '@/components/playbook/playbook-body'
import { PlaybookToc } from '@/components/playbook/playbook-toc'
import {
  GUIDES,
  GUIDE_CATEGORIES,
  PATHS,
  PATH_ORDER,
  nextInPath,
  pathsContaining,
  prevInPath,
} from '@/lib/landing/playbook'
import type { LearningPath } from '@/lib/landing/playbook-types'

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }))
}

interface PageProps {
  params: { slug: string }
  searchParams: { path?: string }
}

export function generateMetadata({ params }: PageProps): Metadata {
  const g = GUIDES.find((x) => x.slug === params.slug)
  if (!g) return { title: 'Guide not found' }

  const ogImage = `https://clipflow.to/api/thumbnail?title=${encodeURIComponent(
    g.title,
  )}&sub=${encodeURIComponent('Clipflow Playbook')}&layout=link&variant=bold`
  return {
    title: `${g.title} — Clipflow Playbook`,
    description: g.description,
    alternates: { canonical: `https://clipflow.to/playbook/${g.slug}` },
    openGraph: {
      title: `${g.title} — Clipflow Playbook`,
      description: g.description,
      url: `https://clipflow.to/playbook/${g.slug}`,
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 627, alt: g.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: g.title,
      description: g.description,
      images: [ogImage],
    },
  }
}

const DIFFICULTY_LABEL = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const

export default function PlaybookGuidePage({ params, searchParams }: PageProps) {
  const guide = GUIDES.find((x) => x.slug === params.slug)
  if (!guide) notFound()

  const category = GUIDE_CATEGORIES[guide.category]

  // Resolve which path context the reader is in. ?path= wins; if absent
  // we fall back to the first path that contains this guide (so the
  // sidebar always has something useful to show).
  const requestedPath = searchParams.path
    ? PATH_ORDER.find((id) => id === searchParams.path)
    : null
  const activePath: LearningPath | null = requestedPath
    ? PATHS[requestedPath]
    : pathsContaining(guide.id)[0] ?? null

  const stepIndex = activePath
    ? activePath.guideIds.indexOf(guide.id) + 1
    : null
  const totalSteps = activePath?.guideIds.length ?? null

  const next = activePath ? nextInPath(activePath, guide.id) : null
  const prev = activePath ? prevInPath(activePath, guide.id) : null
  const nextGuide = next ? GUIDES.find((g) => g.id === next) ?? null : null
  const prevGuide = prev ? GUIDES.find((g) => g.id === prev) ?? null : null

  const relatedGuides = (guide.relatedGuides ?? [])
    .map((slug) => GUIDES.find((g) => g.slug === slug))
    .filter((x): x is (typeof GUIDES)[number] => Boolean(x))

  // BreadcrumbList JSON-LD — surfaces the nav trail in SERP snippets.
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Clipflow', item: 'https://clipflow.to' },
      { '@type': 'ListItem', position: 2, name: 'Playbook', item: 'https://clipflow.to/playbook' },
      { '@type': 'ListItem', position: 3, name: guide.title, item: `https://clipflow.to/playbook/${guide.slug}` },
    ],
  }

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    url: `https://clipflow.to/playbook/${guide.slug}`,
    dateModified: guide.updatedAt,
    datePublished: guide.updatedAt,
    author: { '@type': 'Organization', name: 'Clipflow' },
    publisher: {
      '@type': 'Organization',
      name: 'Clipflow',
      logo: { '@type': 'ImageObject', url: 'https://clipflow.to/opengraph-image' },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />

      <PlaybookShell
        right={
          <PlaybookToc
            sections={guide.sections}
            totalReadMinutes={guide.readTimeMinutes}
          />
        }
        activePathId={activePath?.id ?? null}
        currentSlug={guide.slug}
        guideId={guide.id}
      >
        <article className="pb-24">
          {/* Breadcrumb */}
          <nav
            className="lv2-mono mb-7 flex flex-wrap items-center gap-2 text-[10.5px]"
            style={{ color: 'var(--lv2-muted)', letterSpacing: '0.08em' }}
            aria-label="Breadcrumb"
          >
            <Link href="/playbook" className="hover:text-[var(--lv2-fg)]">
              PLAYBOOK
            </Link>
            <span>·</span>
            <Link
              href={`/playbook?category=${guide.category}`}
              className="hover:text-[var(--lv2-fg)]"
            >
              {category.name.toUpperCase()}
            </Link>
            {activePath ? (
              <>
                <span>·</span>
                <Link
                  href={`/playbook?path=${activePath.id}`}
                  className="inline-flex items-center gap-1 hover:text-[var(--lv2-fg)]"
                >
                  <Compass className="h-3 w-3" />
                  {activePath.name.toUpperCase()}
                </Link>
              </>
            ) : null}
          </nav>

          {/* Path step bar — only when in a path context */}
          {activePath && stepIndex && totalSteps ? (
            <div
              className="mb-8 rounded-2xl border p-4"
              style={{
                borderColor: 'var(--lv2-border)',
                background: 'var(--lv2-card)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden className="text-[18px]">{activePath.emoji}</span>
                  <div>
                    <p
                      className="lv2-mono text-[10px] font-bold uppercase tracking-[0.16em]"
                      style={{ color: 'var(--lv2-muted)' }}
                    >
                      Step {stepIndex} of {totalSteps}
                    </p>
                    <p
                      className="text-[12.5px] font-bold"
                      style={{ color: 'var(--lv2-fg)' }}
                    >
                      {activePath.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: i === stepIndex - 1 ? 22 : 8,
                        background:
                          i < stepIndex
                            ? 'var(--lv2-primary)'
                            : 'var(--lv2-border)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Hero */}
          <header className="mb-10">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span
                className="lv2-mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{
                  background: 'var(--lv2-primary-soft)',
                  color: 'var(--lv2-primary)',
                }}
              >
                <span aria-hidden>{category.emoji}</span>
                {category.name}
              </span>
              <span
                className="lv2-mono rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{
                  background: 'var(--lv2-bg-2)',
                  color: 'var(--lv2-muted)',
                }}
              >
                {DIFFICULTY_LABEL[guide.difficulty]}
              </span>
              <span
                className="lv2-mono inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.08em]"
                style={{ color: 'var(--lv2-muted)' }}
              >
                <Clock className="h-3 w-3" />
                {guide.readTimeMinutes} min read
              </span>
            </div>

            <h1
              className="lv2-display text-[40px] leading-[1.02] sm:text-[58px]"
              style={{ color: 'var(--lv2-primary)' }}
            >
              {guide.title}
            </h1>
            <p
              className="mt-5 max-w-[680px] text-[17px] leading-relaxed"
              style={{ color: 'var(--lv2-fg-soft)' }}
            >
              {guide.subtitle}
            </p>
          </header>

          {/* TL;DR — auto-generated from section titles */}
          {guide.sections.length >= 2 ? (
            <div
              className="mb-12 rounded-2xl border p-6"
              style={{
                borderColor: 'var(--lv2-primary)',
                background:
                  'linear-gradient(135deg, var(--lv2-primary-soft) 0%, var(--lv2-card) 100%)',
              }}
            >
              <p className="lv2-mono mb-3 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--lv2-primary)' }}>
                What this guide covers
              </p>
              <ol className="space-y-2">
                {guide.sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="group flex items-start gap-3 text-[14px] leading-snug transition-colors hover:text-[var(--lv2-primary)]"
                      style={{ color: 'var(--lv2-fg)' }}
                    >
                      <span
                        className="lv2-mono mt-0.5 inline-flex h-5 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                        style={{
                          background: 'var(--lv2-primary)',
                          color: 'var(--lv2-accent)',
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{s.title}</span>
                      <ArrowRight
                        className="mt-1 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60"
                        style={{ color: 'var(--lv2-primary)' }}
                      />
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {/* Sections */}
          <div className="space-y-0">
            {guide.sections.map((section, i) => (
              <PlaybookSection
                key={section.id}
                section={section}
                index={i + 1}
                isFirst={i === 0}
              />
            ))}
          </div>

          {/* Path navigation bar — prev / next within path */}
          {activePath && (nextGuide || prevGuide) ? (
            <nav className="mt-16 grid gap-3 sm:grid-cols-2">
              {prevGuide ? (
                <Link
                  href={`/playbook/${prevGuide.slug}?path=${activePath.id}`}
                  className="group flex flex-col gap-1 rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-md"
                  style={{
                    borderColor: 'var(--lv2-border)',
                    background: 'var(--lv2-card)',
                  }}
                >
                  <span
                    className="lv2-mono inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: 'var(--lv2-muted)' }}
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Previous step
                  </span>
                  <span
                    className="lv2-display text-[18px] leading-tight"
                    style={{ color: 'var(--lv2-fg)' }}
                  >
                    {prevGuide.title}
                  </span>
                </Link>
              ) : (
                <span aria-hidden />
              )}
              {nextGuide ? (
                <Link
                  href={`/playbook/${nextGuide.slug}?path=${activePath.id}`}
                  className="group flex flex-col items-end gap-1 rounded-2xl border p-5 text-right transition-all hover:-translate-y-1 hover:shadow-md"
                  style={{
                    borderColor: 'var(--lv2-primary)',
                    background: 'var(--lv2-primary)',
                    color: 'var(--lv2-accent)',
                  }}
                >
                  <span className="lv2-mono inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em]">
                    Next in {activePath.name}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="lv2-display text-[18px] leading-tight">
                    {nextGuide.title}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/playbook"
                  className="group flex flex-col items-end gap-1 rounded-2xl border p-5 text-right transition-all hover:-translate-y-1 hover:shadow-md"
                  style={{
                    borderColor: 'var(--lv2-primary)',
                    background: 'var(--lv2-primary)',
                    color: 'var(--lv2-accent)',
                  }}
                >
                  <span className="lv2-mono inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em]">
                    Path complete
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="lv2-display text-[18px] leading-tight">
                    Back to all guides
                  </span>
                </Link>
              )}
            </nav>
          ) : null}

          {/* Related (only outside a path context) */}
          {!activePath && relatedGuides.length > 0 ? (
            <section
              className="mt-16 border-t pt-12"
              style={{ borderColor: 'var(--lv2-border)' }}
            >
              <p className="lv2-mono-label mb-5">Keep reading</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedGuides.map((r) => (
                  <Link
                    key={r.id}
                    href={`/playbook/${r.slug}`}
                    className="group flex items-start gap-3 rounded-xl p-4 transition-all hover:-translate-y-px"
                    style={{
                      background: 'var(--lv2-card)',
                      border: '1px solid var(--lv2-border)',
                    }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[18px]"
                      style={{ background: 'var(--lv2-primary-soft)' }}
                      aria-hidden
                    >
                      {r.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[14px] font-bold leading-snug"
                        style={{ color: 'var(--lv2-fg)' }}
                      >
                        {r.title}
                      </p>
                      <p
                        className="mt-1 text-[11.5px] leading-relaxed"
                        style={{ color: 'var(--lv2-muted)' }}
                      >
                        {r.subtitle.slice(0, 100)}
                        {r.subtitle.length > 100 ? '…' : ''}
                      </p>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                      style={{ color: 'var(--lv2-muted)' }}
                    />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* Final CTA */}
          <section
            className="mt-16 rounded-[28px] p-10 text-center sm:p-14"
            style={{ background: 'var(--lv2-primary)' }}
          >
            <h2
              className="lv2-display mx-auto max-w-[480px] text-[28px] leading-[1.04] sm:text-[36px]"
              style={{ color: 'var(--lv2-accent)' }}
            >
              Try this workflow on your next recording.
            </h2>
            <p
              className="mx-auto mt-3 max-w-[440px] text-[14px]"
              style={{ color: 'rgba(255,255,255,.72)' }}
            >
              Free tier, no credit card. Your first draft lands in about two
              minutes.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition-transform hover:-translate-y-px"
              style={{
                background: 'var(--lv2-accent)',
                color: 'var(--lv2-accent-ink)',
              }}
            >
              Start free on Clipflow
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <p className="mt-8 text-center">
            <Link
              href="/playbook"
              className="lv2-mono inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] transition-colors hover:text-[var(--lv2-fg)]"
              style={{ color: 'var(--lv2-muted)' }}
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Playbook
            </Link>
          </p>
        </article>
      </PlaybookShell>
    </>
  )
}
