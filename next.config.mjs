import { withSentryConfig } from '@sentry/nextjs'

/**
 * Security response headers. Applied globally via `headers()` below.
 * Kept minimal on purpose — CSP is intentionally omitted for now
 * because Next 14 + Sentry + Stripe's embedded elements each need
 * their own script-src exemptions, and a half-right CSP is worse
 * than none. When we add one, start in report-only mode.
 *
 * - HSTS tells the browser to always use HTTPS for clipflow.to for
 *   a year. Vercel sets this automatically on the apex, but we want
 *   it on all paths including the custom-domain review-link tenants.
 * - X-Frame-Options blocks clickjacking attempts on the app. The
 *   review-link pages DO allow framing (they're embedded by clients)
 *   and override this via their own `<meta>` / route config.
 * - X-Content-Type-Options blocks MIME sniffing — an uploaded file
 *   that sniffs as HTML can't be served inline through Storage URLs.
 * - Referrer-Policy caps what we leak to external domains. "strict-
 *   origin-when-cross-origin" is the browser default but older
 *   versions of Safari don't honour it without an explicit header.
 * - Permissions-Policy disables features we never use (camera,
 *   microphone except the voice-recorder, geolocation). Tightens
 *   the attack surface of any compromised third-party script.
 */
const SECURITY_HEADERS = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), payment=(self "https://js.stripe.com"), microphone=(self)',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Everything. Review-link tenants that need iframing override
        // X-Frame-Options per-route via their own response headers.
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        // Pexels B-Roll + photo suggestions — rendered as grid
        // thumbnails on /content/[id]/broll. High-traffic in-app path.
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        // Pexels videos deliver still frames (thumbnails) from a
        // separate subdomain that we need for the B-Roll card posters.
        protocol: 'https',
        hostname: 'videos.pexels.com',
        pathname: '/**',
      },
    ],
  },
}

// Sentry SDK 8.x is compatible with Next 14.2 — version 10 had a
// webpack-plugin race with Next's build-trace collection that left
// pages-manifest.json missing on every other build.
//
// withSentryConfig is a no-op when SENTRY_* env vars are unset, so
// deploys without Sentry credentials build normally. Source-map
// upload kicks in automatically when SENTRY_AUTH_TOKEN + SENTRY_ORG +
// SENTRY_PROJECT are set in Vercel envs.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
})
