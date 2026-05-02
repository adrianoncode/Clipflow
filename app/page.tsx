import type { Metadata } from 'next'
import { Suspense } from 'react'

import { LandingClient } from '@/components/landing/landing-client'

// Homepage inherits the site-wide title / description / OG / Twitter
// metadata from `app/layout.tsx` so the SERP snippet, link-preview card,
// and <title> all tell the same story. Only the canonical is pinned
// here to the bare apex.
export const metadata: Metadata = {
  alternates: { canonical: 'https://clipflow.to' },
}

// Public-facing JSON-LD. Schemas are emitted independently rather
// than as one `@graph` so each is parsed in isolation by every
// consumer (Google, Bing, social scrapers, AI search). Combining them
// into a graph would be valid but a single typo would invalidate the
// whole tree, dropping all five rich-result eligibilities.
//
// - Organization      → brand entity for Knowledge Panel
// - WebSite           → enables sitelinks searchbox in SERP
// - SoftwareApplication → product card for app-search results
// - FAQPage           → rich-snippet Q&A blocks
// - BreadcrumbList    → trail in SERP under the title
const ORGANIZATION_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Clipflow',
  legalName: 'Clipflow GmbH',
  url: 'https://clipflow.to',
  logo: 'https://clipflow.to/opengraph-image',
  description:
    'AI content repurposing for creators and agencies — captions, brand voice, multi-platform scheduling.',
  sameAs: [
    'https://twitter.com/clipflow',
    'https://x.com/clipflow',
    'https://www.linkedin.com/company/clipflow',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@clipflow.to',
      availableLanguage: ['English'],
    },
  ],
}

// WebSite + SearchAction unlocks Google's sitelinks searchbox under
// the brand result. The query template uses the same `?q=` parameter
// the in-app search uses, so users typing in the SERP land directly
// on the right view.
const WEBSITE_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Clipflow',
  url: 'https://clipflow.to',
  inLanguage: 'en',
  publisher: { '@type': 'Organization', name: 'Clipflow' },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://clipflow.to/playbook?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

// AggregateRating gate. Google treats synthetic review counts as
// review-spam and can issue a sitewide manual penalty, so the schema
// only emits when the env vars are explicitly set in production.
//
// Activation procedure (do NOT shortcut):
//   1. Collect ≥20 verified reviews on a single source (Trustpilot,
//      G2, Capterra, ProductHunt).
//   2. Set in Vercel env:
//        NEXT_PUBLIC_REVIEW_RATING=4.7
//        NEXT_PUBLIC_REVIEW_COUNT=24
//        NEXT_PUBLIC_REVIEW_SOURCE_URL=https://www.g2.com/products/clipflow
//   3. The visible page must show ≥20 reviews matching this count
//      (Google validates against the rendered DOM, not just the JSON-LD).
function aggregateRatingFromEnv() {
  const rating = process.env.NEXT_PUBLIC_REVIEW_RATING
  const count = process.env.NEXT_PUBLIC_REVIEW_COUNT
  if (!rating || !count) return undefined
  const ratingValue = Number(rating)
  const reviewCount = Number(count)
  if (!Number.isFinite(ratingValue) || !Number.isFinite(reviewCount)) return undefined
  if (reviewCount < 20) return undefined
  return {
    '@type': 'AggregateRating' as const,
    ratingValue: ratingValue.toFixed(1),
    reviewCount: String(Math.floor(reviewCount)),
    bestRating: '5',
    worstRating: '1',
    ...(process.env.NEXT_PUBLIC_REVIEW_SOURCE_URL
      ? { url: process.env.NEXT_PUBLIC_REVIEW_SOURCE_URL }
      : {}),
  }
}

const SOFTWARE_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Clipflow',
  applicationCategory: 'MultimediaApplication',
  applicationSubCategory: 'Video Repurposing',
  operatingSystem: 'Web',
  url: 'https://clipflow.to',
  description:
    'Turn one recording into TikTok, Reels, Shorts & LinkedIn posts with auto-subtitles, AI reframe, and brand voice.',
  featureList: [
    'AI Brand Voice captions',
    'Auto-subtitle generation',
    'AI reframe to vertical / square',
    'Multi-platform scheduler',
    'A/B hook testing',
    'White-label client review links',
    'BYOK AI pricing — pay your provider at cost',
  ],
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '0',
      priceCurrency: 'USD',
      category: 'free',
    },
    {
      '@type': 'Offer',
      name: 'Creator',
      price: '29',
      priceCurrency: 'USD',
    },
    {
      '@type': 'Offer',
      name: 'Studio',
      price: '99',
      priceCurrency: 'USD',
    },
  ],
  ...(aggregateRatingFromEnv()
    ? { aggregateRating: aggregateRatingFromEnv() }
    : {}),
}

const BREADCRUMB_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Clipflow',
      item: 'https://clipflow.to',
    },
  ],
}

const FAQ_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Will my captions sound AI-generated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "No. The brand voice engine reads everything you've already published and writes in your exact pattern. Most users can't tell which captions were AI vs. human — that's the point.",
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if I go over my minutes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We email you at 80%, 95%, and 100%. At 100%, processing pauses until you upgrade or top up. No surprise bills.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you store my raw footage?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Only while we process it. Raw files are deleted after 30 days by default; clips and transcripts stay as long as your workspace does.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which platforms can I publish to?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'TikTok, YouTube (Shorts + long-form), Instagram (Reels + feed), LinkedIn, and X.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel anytime?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Two clicks. Your clips stay; billing stops immediately.',
      },
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_LD) }}
      />
      {/* Suspense lets the page stay statically prerendered while the
          ref-aware bits inside still read `useSearchParams` on the client. */}
      <Suspense fallback={null}>
        <LandingClient />
      </Suspense>
    </>
  )
}
