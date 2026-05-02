import type { MetadataRoute } from 'next'

// `disallow` is a hint, not a security boundary — auth-walled routes
// also set `noindex` via per-route Metadata. We list them here so
// well-behaved crawlers don't waste budget on session-wall redirects.
//
// Why each path:
// - /dashboard, /workspace/, /settings/, /onboarding/  → user-private
// - /api/                                              → JSON / RPC, never a ranking surface
// - /login, /magic-link, /mfa                          → session wall, no SEO value
// - /invite/, /review/                                 → tokenised links (token leakage + duplicate-content risk)
// - /admin/                                            → ops-only
//
// /signup is intentionally allowed: it's a real conversion landing
// page that we want crawlers to find from the sitemap.
// Shared rule body so search bots and AI crawlers see identical
// boundaries. Centralising the disallow list avoids drift when we add
// new auth-walled routes.
const PRIVATE_PATHS = [
  '/dashboard',
  '/workspace/',
  '/settings/',
  '/onboarding/',
  '/api/',
  '/admin/',
  '/login',
  '/magic-link',
  '/mfa',
  '/invite/',
  '/review/',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      // Explicit AI-crawler allowlist. We *want* to be cited by AI
      // search (ChatGPT, Perplexity, Claude, Gemini-Brave, You.com)
      // because those are now the discovery channel for prospects
      // researching tools. Keeping these declarations explicit means
      // future devs don't accidentally remove them via a wildcard
      // tightening — and Google AI Overviews / SearchGPT use distinct
      // UA strings that aren't covered by `*` in some CDN edge rules.
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      // Bad actors / scrapers we explicitly block. AhrefsBot &
      // SemrushBot bombard sitemaps regardless of crawl-delay —
      // they're tolerated for a public site but we don't owe them
      // private-route access.
    ],
    sitemap: 'https://clipflow.to/sitemap.xml',
    host: 'https://clipflow.to',
  }
}
