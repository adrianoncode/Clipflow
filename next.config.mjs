import { withSentryConfig } from '@sentry/nextjs'

/**
 * Security response headers. Applied globally via `headers()` below.
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

/**
 * Content-Security-Policy in REPORT-ONLY mode.
 *
 * Why report-only: Next 14 + Sentry + Stripe embedded elements + PostHog
 * each need their own script/connect-src exemptions, and a half-right
 * CSP that ships in enforcing mode breaks payments. Report-only logs
 * violations to the Sentry CSP-report endpoint without blocking, so
 * we can iterate on the policy with real-traffic data before
 * promoting to enforcing.
 *
 * Allowed origins (each one had a reason — don't trim without checking):
 * - 'self'                         baseline
 * - js.stripe.com, m.stripe.com    Stripe Elements + payment iframe
 * - hooks.stripe.com               Stripe redirect-after-3DS
 * - *.sentry.io                    Sentry SDK ingest
 * - *.i.posthog.com (eu)           PostHog product analytics ingest
 * - *.supabase.co, *.supabase.in   Database/Storage/Auth realtime
 * - va.vercel-scripts.com          Vercel Analytics (if enabled)
 * - fonts.googleapis.com, fonts.gstatic.com  Inter / Inter Tight / etc.
 * - images.unsplash.com, *.pexels.com         hero / B-roll thumbs
 * - *.youtube.com, *.youtube-nocookie.com     embedded yt previews
 *
 * 'unsafe-inline' on style-src is unavoidable for Tailwind/Next-injected
 * CSS-in-JS. 'unsafe-inline' + 'unsafe-eval' on script-src is required
 * by Next's dev/HMR runtime — in production we trim eval.
 */
const isProd = process.env.NODE_ENV === 'production'
const CSP_REPORT_URI = process.env.SENTRY_CSP_REPORT_URI ?? ''
const CSP_DIRECTIVES = [
  "default-src 'self'",
  // Scripts: Next.js needs inline + eval in dev for HMR; eval is dropped in prod.
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://js.stripe.com https://m.stripe.com https://*.sentry.io https://eu.i.posthog.com https://us.i.posthog.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Images: include data: + blob: for OG cards and inline thumbnails;
  // remote hosts mirror next.config.mjs `images.remotePatterns` so a
  // mismatch here surfaces as a CSP report instead of a silent break.
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://images.pexels.com https://videos.pexels.com https://*.stripe.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io https://eu.i.posthog.com https://us.i.posthog.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.youtube.com https://*.youtube-nocookie.com",
  "media-src 'self' blob: https://*.supabase.co",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://hooks.stripe.com",
  "frame-ancestors 'self'",
  // upgrade-insecure-requests breaks local http://127.0.0.1 supabase
  // images during dev, so we only emit it in production.
  ...(isProd ? ['upgrade-insecure-requests'] : []),
  ...(CSP_REPORT_URI ? [`report-uri ${CSP_REPORT_URI}`] : []),
].join('; ')

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
  // Report-Only: log violations, don't block. Promote to
  // `Content-Security-Policy` after a week of clean reports.
  {
    key: 'Content-Security-Policy-Report-Only',
    value: CSP_DIRECTIVES,
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
      {
        // sitemap.xml + robots.txt: shorter cache so a redeploy that
        // adds a new feature/playbook page surfaces in Google within
        // the hour. Vercel's edge respects `s-maxage` for CDN caching;
        // `max-age=0` keeps browsers honest.
        source: '/sitemap.xml',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=3600, must-revalidate' },
          { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=86400, must-revalidate' },
        ],
      },
      {
        // OpenGraph image — heavy to render via @vercel/og, so cache
        // it aggressively at the edge. Browsers don't cache by default
        // (LinkedIn/Slack scrapers bust their own previews) so this
        // is purely an edge optimisation.
        source: '/opengraph-image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        // Apple touch icon — same dynamic-render concern as OG image.
        // 7 day edge cache, week-long SWR (the brand mark is stable).
        source: '/apple-icon',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000' },
        ],
      },
    ]
  },
  // SEO + Core Web Vitals: ship AVIF first, WebP as fallback. Saves
  // 25-50% bytes vs. legacy PNG/JPG, which is the single largest LCP
  // win for image-heavy landing pages. `minimumCacheTTL` keeps
  // resized variants in the edge cache so we don't re-encode the
  // same image on every locale-cookie variant.
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
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
