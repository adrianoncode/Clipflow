import type { MetadataRoute } from 'next'

/**
 * PWA manifest — served at /manifest.webmanifest by Next's
 * app-router metadata API. Lets mobile users Add-to-Homescreen and
 * get a real app icon + splash screen.
 *
 * Kept deliberately minimal: no service worker yet, no offline mode.
 * The manifest alone covers ~80% of the PWA story (installability +
 * native-looking launch) without the complexity of a worker.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clipflow — One recording. A month of posts.',
    short_name: 'Clipflow',
    description:
      'Turn one recording into TikTok, Reels, Shorts & LinkedIn posts with auto-subtitles, AI reframe, and brand voice.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    // Brand surface — paper background + charcoal chrome accent.
    // Migrated from the legacy violet (#7c3aed) when the system moved
    // to the Crextio charcoal+yellow palette. theme_color drives the
    // status-bar tint on Android / iOS so it must reflect the actual
    // brand chrome the user sees in-app.
    background_color: '#FAF7F2',
    theme_color: '#0F0F0F',
    orientation: 'portrait',
    lang: 'en',
    dir: 'ltr',
    categories: ['productivity', 'business', 'social'],
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
