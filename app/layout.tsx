import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Inter, Inter_Tight, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { CookieConsent } from '@/components/cookie-consent'
import { MarketingAnalytics } from '@/components/analytics/marketing-analytics'
import { Toaster } from 'sonner'
import './globals.css'

// `Inter` remains the workhorse body font used across the app.
// `Inter Tight` is the tighter display cut used on the marketing
// landing page for headlines — gives a more distinct, premium feel.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
})

// Display serif + mono used by the marketing landing page.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

// Canonical site description kept to ≤155 chars so Google doesn't truncate
// mid-sentence in the SERP snippet. Claims drop A/B-hook testing (not yet
// built) and stick to capabilities that actually ship.
const SITE_DESCRIPTION =
  'Turn one recording into TikTok, Reels, Shorts & LinkedIn posts with auto-subtitles, AI reframe, and brand voice. BYOK AI — pay your provider at cost.'

// `applicationName` and `creator` surface in the share-card for Slack /
// LinkedIn previews and on iOS Add-to-Home-Screen. They cost nothing
// and improve attribution across platforms that don't fetch OG.
export const metadata: Metadata = {
  metadataBase: new URL('https://clipflow.to'),
  title: {
    default: 'Clipflow — One recording. A month of posts.',
    template: '%s | Clipflow',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'Clipflow',
  generator: 'Next.js',
  referrer: 'strict-origin-when-cross-origin',
  authors: [{ name: 'Clipflow', url: 'https://clipflow.to' }],
  creator: 'Clipflow',
  publisher: 'Clipflow',
  category: 'technology',
  // Google ignores `keywords` since 2009 but Bing / Yandex / DuckDuckGo
  // still read them. Curated short list — keyword-stuffing here is
  // worse than no list at all because it dilutes topical relevance.
  keywords: [
    'content repurposing',
    'AI video repurposing',
    'TikTok content generator',
    'Instagram Reels generator',
    'YouTube Shorts generator',
    'LinkedIn post generator',
    'AI captions',
    'AI reframe',
    'brand voice AI',
    'social media scheduler',
    'BYOK AI',
    'OpusClip alternative',
    'Klap alternative',
    'Descript alternative',
    'Clipflow',
  ],
  alternates: {
    canonical: 'https://clipflow.to',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clipflow.to',
    siteName: 'Clipflow',
    title: 'Clipflow — One recording. A month of posts.',
    description: SITE_DESCRIPTION,
    // Explicit images entry. Next auto-discovers /opengraph-image but
    // some scrapers (LinkedIn's old crawler, Slack's preview cache)
    // only respect `og:image` declared in the metadata API. Setting
    // both belt-and-braces guarantees the unfurl card lands.
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Clipflow — One recording. A month of posts.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@clipflow',
    creator: '@clipflow',
    title: 'Clipflow — One recording. A month of posts.',
    description: SITE_DESCRIPTION,
    images: ['/opengraph-image'],
  },
  // Granular bot directives. The canonical short-form (`index, follow`)
  // is fine, but `googleBot.max-image-preview: 'large'` is what unlocks
  // the larger preview thumbnail in Discover / News, and `max-snippet`
  // lets Google show the full meta description without truncation.
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Verification meta tags. Values are pulled from env so we don't
  // commit ownership tokens. When the env var is absent the field is
  // simply omitted — no broken `<meta>` is emitted.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION }
      : undefined,
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Icon resolution. `/icon.png` is the static favicon (also referenced
  // from manifest.ts at 192/512). `/apple-icon` is dynamically generated
  // by app/apple-icon.tsx at 180×180 — single source of brand truth so
  // the lockup matches the OG card and in-app sidebar.
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
}

// Theme + viewport are split out per Next 14.2 metadata API. Keeping
// them here means iOS / Android status bars match the actual brand
// chrome (charcoal) instead of the stale violet that used to live in
// app/manifest.ts.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F2' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0F0F' },
  ],
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
          {/* Site-wide RUM + anonymous pageview tracking. Inside Suspense
              because usePostHogPageView() reads useSearchParams which
              would otherwise opt the entire tree out of static
              rendering and tank the marketing-page LCP. */}
          <Suspense fallback={null}>
            <MarketingAnalytics />
          </Suspense>
          <CookieConsent />
          <Toaster
            position="bottom-right"
            offset={16}
            toastOptions={{
              style: {
                background: '#FFFDF8',
                border: '1px solid #E5DDCE',
                color: '#181511',
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
                fontSize: 13,
                borderRadius: 12,
                boxShadow:
                  '0 1px 0 rgba(24,21,17,.04), 0 20px 40px -24px rgba(15,15,15,.28)',
              },
              classNames: {
                description: 'lv2-toast-desc',
                actionButton: 'lv2-toast-action',
                cancelButton: 'lv2-toast-cancel',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
