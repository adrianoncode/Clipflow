import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ArrowLeft, Clock } from 'lucide-react'

import { PlaybookLayout } from '@/components/playbook/playbook-layout'
import { PlaybookSection } from '@/components/playbook/playbook-body'
import { PlaybookToc } from '@/components/playbook/playbook-toc'
import { GUIDES, GUIDE_CATEGORIES } from '@/lib/landing/playbook'

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }))
}

interface PageProps {
  params: { slug: string }
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

export default function PlaybookGuidePage({ params }: PageProps) {
  const guide = GUIDES.find((x) => x.slug === params.slug)
  if (!guide) notFound()

  const category = GUIDE_CATEGORIES[guide.category]
  const relatedGuides = (guide.relatedGuides ?? [])
    .map((id) => GUIDES.find((g) => g.id === id))
    .filter((x): x is (typeof GUIDES)[number] => Boolean(x))

  // BreadcrumbList JSON-LD — surfaces the nav trail in SERP snippets.
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Clipflow',
        item: 'https://clipflow.to',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Playbook',
        item: 'https://clipflow.to/playbook',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: guide.title,
        item: `https://clipflow.to/playbook/${guide.slug}`,
      },
    ],
  }

  // Article JSON-LD — helps long-form guides rank with rich cards.
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
      logo: {
        '@type': 'ImageObject',
        url: 'https://clipflow.to/opengraph-image',
      },
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

      <PlaybookLayout right={<PlaybookToc sections={guide.sections} />}>
        <article className="pb-24">
          {/* Breadcrumb */}
          <nav
            className="lv2-mono mb-6 flex flex-wrap items-center gap-2 text-[10.5px]"
            style={{ color: 'var(--lv2-muted)', letterSpacing: '0.08em' }}
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-[var(--lv2-fg)]">
              CLIPFLOW
            </Link>
            <span>·</span>
            <Link href="/playbook" className="hover:text-[var(--lv2-fg)]">
              PLAYBOOK
            </Link>
            <span>·</span>
            <span style={{ color: 'var(--lv2-fg)' }}>{category.name.toUpperCase()}</span>
          </nav>

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
              className="lv2-display text-[42px] leading-[1.02] sm:text-[58px]"
              style={{ color: 'var(--lv2-primary)' }}
            >
              {guide.title}
            </h1>
            <p
              className="mt-5 max-w-[680px] text-[17.5px] leading-relaxed"
              style={{ color: 'var(--lv2-fg-soft)' }}
            >
              {guide.subtitle}
            </p>
          </header>

          {/* Sections */}
          <div className="space-y-0">
            {guide.sections.map((section) => (
              <PlaybookSection key={section.id} section={section} />
            ))}
          </div>

          {/* Related */}
          {relatedGuides.length > 0 ? (
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
            className="mt-16 rounded-[28px] p-10 text-center sm:p-16"
            style={{ background: 'var(--lv2-primary)' }}
          >
            <h2
              className="lv2-display mx-auto max-w-[480px] text-[32px] leading-[1.04] sm:text-[40px]"
              style={{ color: 'var(--lv2-accent)' }}
            >
              Try this workflow on your next recording.
            </h2>
            <p
              className="mx-auto mt-4 max-w-[440px] text-[15px]"
              style={{ color: 'rgba(255,255,255,.72)' }}
            >
              Free tier, no credit card. Your first draft lands in about two
              minutes — and you can cancel in two clicks if it is not for you.
            </p>
            <Link
              href="/signup"
              className="mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14.5px] font-bold"
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
              className="lv2-mono inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em]"
              style={{ color: 'var(--lv2-muted)' }}
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Playbook
            </Link>
          </p>
        </article>
      </PlaybookLayout>
    </>
  )
}
