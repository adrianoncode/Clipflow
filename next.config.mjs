import { withSentryConfig } from '@sentry/nextjs'

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
