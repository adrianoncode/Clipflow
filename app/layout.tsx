import type { Metadata } from 'next'
import { Inter, Inter_Tight, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { CookieConsent } from '@/components/cookie-consent'
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

export const metadata: Metadata = {
  title: {
    default: 'Clipflow — One recording. A month of posts.',
    template: '%s | Clipflow',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'content repurposing',
    'AI content creator',
    'TikTok content generator',
    'Instagram Reels generator',
    'YouTube Shorts generator',
    'LinkedIn post generator',
    'video to social media',
    'AI video editor',
    'social media automation',
    'content scheduling tool',
    'auto subtitles',
    'AI reframe',
    'brand voice AI',
    'social media management',
    'content marketing tool',
    'BYOK AI',
    'video repurposing',
    'short form content',
    'content creator tools',
    'agency content tool',
    'OpusClip alternative',
    'Klap alternative',
    'Clipflow',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clipflow.to',
    siteName: 'Clipflow',
    title: 'Clipflow — One recording. A month of posts.',
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@clipflow',
    creator: '@clipflow',
    title: 'Clipflow — One recording. A month of posts.',
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL('https://clipflow.to'),
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
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          {children}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  )
}
