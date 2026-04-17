/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ],
  },
}

// NOTE: `withSentryConfig` from @sentry/nextjs 10+ is incompatible with
// Next 14.2 — the webpack plugin races with Next's build-trace collection
// and leaves pages-manifest.json missing. Runtime Sentry (via
// instrumentation.ts + app/global-error.tsx + sentry.*.config.ts) still
// fires on every error and forwards to the DSN — we just lose
// source-map upload at build time, which isn't critical for v1.
//
// Revisit once we upgrade to Next 15 (where Sentry SDK 10 is fully
// supported via instrumentation-client.ts).
export default nextConfig
