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
    name: 'Clipflow',
    short_name: 'Clipflow',
    description:
      'One video. Every platform. Turn videos into TikTok, Reels, Shorts, and LinkedIn posts in seconds.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7c3aed',
    orientation: 'portrait',
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
