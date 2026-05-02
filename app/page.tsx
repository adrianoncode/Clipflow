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

// Public-facing JSON-LD. Four separate schemas so each can be consumed
// independently: Organization for brand entity, SoftwareApplication for
// product search, FAQPage for rich-snippet answers in the SERP, and
// AggregateRating to surface the visible star rating.
const ORGANIZATION_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Clipflow',
  url: 'https://clipflow.to',
  logo: 'https://clipflow.to/opengraph-image',
  sameAs: ['https://twitter.com/clipflow'],
}

const SOFTWARE_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Clipflow',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description:
    'Turn one recording into TikTok, Reels, Shorts & LinkedIn posts with auto-subtitles, AI reframe, and brand voice.',
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
  // aggregateRating intentionally omitted — Google treats synthetic
  // review counts as review-spam and can issue a manual penalty that
  // affects the whole site. Re-add only when we have ≥20 real reviews
  // from a verified source (Trustpilot, Capterra, G2).
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
      />
      {/* Suspense lets the page stay statically prerendered while the
          ref-aware bits inside still read `useSearchParams` on the client. */}
      <Suspense fallback={null}>
        <LandingClient />
      </Suspense>
    </>
  )
}
