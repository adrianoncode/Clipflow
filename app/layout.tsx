import type { Metadata } from 'next'
import { Inter, Inter_Tight, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { CookieConsent } from '@/components/cookie-consent'
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

// JetBrains Mono is only used for tiny `lv2-mono-label` chips (9–11px) that
// are never the LCP element. Skipping preload removes one `<link rel="preload">`
// from `<head>` so the critical request budget goes to Inter + Instrument
// Serif (the body + LCP-candidate fonts). The mono file still loads in time
// via `display: swap` once the first label renders.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: false,
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
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
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
