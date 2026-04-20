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

export const metadata: Metadata = {
  title: {
    default: 'Clipflow — AI Content Repurposing for Creators & Agencies',
    template: '%s | Clipflow',
  },
  description:
    'Turn one video into TikTok, Instagram Reels, YouTube Shorts & LinkedIn posts in seconds. AI-powered content repurposing with auto-subtitles, B-Roll, A/B-tested hooks, and social scheduling. BYOK — bring your own AI key.',
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
    'AI B-Roll',
    'A/B hook testing',
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
    title: 'Clipflow — AI Content Repurposing for Creators & Agencies',
    description:
      'Turn one video into TikTok, Reels, Shorts & LinkedIn posts in seconds. Auto-subtitles, B-Roll, A/B-tested hooks & scheduling.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clipflow — AI Content Repurposing',
    description:
      'One video → TikTok, Reels, Shorts & LinkedIn. AI-powered with BYOK.',
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
