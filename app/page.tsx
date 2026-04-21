import type { Metadata } from 'next'

import { NewLanding } from '@/components/landing/new-landing'
import { SmoothScroll } from '@/components/landing/smooth-scroll'
import { normalizeReferralCode } from '@/lib/referrals/normalize-code'
import { lookupReferrerUserId } from '@/lib/referrals/lookup-referrer'
import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'

// Homepage inherits the site-wide title / description / OG / Twitter
// metadata from `app/layout.tsx` so the SERP snippet, link-preview card,
// and <title> all tell the same story. Only the canonical is pinned
// here to the bare apex.
export const metadata: Metadata = {
  alternates: { canonical: 'https://clipflow.to' },
}

interface HomePageProps {
  searchParams: { ref?: string; source?: string }
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
      price: '89',
      priceCurrency: 'USD',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '2183',
    bestRating: '5',
    worstRating: '1',
  },
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

export default async function HomePage({ searchParams }: HomePageProps) {
  const refCode = normalizeReferralCode(searchParams.ref)
  const hasValidRef = refCode ? Boolean(await lookupReferrerUserId(refCode)) : false
  const signupHref = hasValidRef
    ? `/signup?ref=${refCode}${searchParams.source ? `&source=${encodeURIComponent(searchParams.source)}` : ''}`
    : '/signup'

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
      <SmoothScroll />
      <NewLanding
        signupHref={signupHref}
        hasValidRef={hasValidRef}
        referralPercent={REFERRAL_DISCOUNT_PERCENT}
      />
    </>
  )
}
