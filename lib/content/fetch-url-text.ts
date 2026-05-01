import 'server-only'

import { parse } from 'node-html-parser'
import { readBoundedText } from '@/lib/security/bounded-fetch'
import { isPublicUrl } from '@/lib/security/is-public-url'

/** 10 MB. Any blog page or article fits comfortably in this; anything
 *  larger is almost certainly a malicious / runaway response we don't
 *  want in our process memory. */
const MAX_BYTES = 10 * 1024 * 1024

export type FetchUrlTextResult =
  | { ok: true; text: string; title: string }
  | { ok: false; error: string }

// Tags whose content we skip entirely (scripts, styles, nav boilerplate).
const SKIP_TAGS = new Set([
  'script', 'style', 'noscript', 'nav', 'footer', 'header',
  'aside', 'form', 'button', 'svg', 'iframe',
])

/**
 * Fetches a blog or website URL and extracts the main readable text.
 * Uses node-html-parser (no headless browser needed). Works well for
 * server-rendered pages and static blogs.
 *
 * Not guaranteed to work on heavy SPAs — those render content in JS
 * and return an empty shell on first fetch.
 */
export async function fetchUrlText(url: string): Promise<FetchUrlTextResult> {
  // SSRF guard — reject loopback, private IPs, cloud metadata endpoints,
  // non-http(s) schemes. Blocks user-supplied URLs from hitting internal
  // services or the AWS/GCP/Azure metadata IMDS.
  const check = await isPublicUrl(url)
  if (!check.ok) return { ok: false, error: check.reason }

  let res: Response
  try {
    res = await fetch(check.url.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Clipflow/1.0; +https://clipflow.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15_000),
      redirect: 'manual',
    })
    // If the server redirects, re-validate the target against the SSRF guard.
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return { ok: false, error: 'Redirect without location header.' }
      const redirected = await isPublicUrl(new URL(loc, check.url).toString())
      if (!redirected.ok) return { ok: false, error: redirected.reason }
      res = await fetch(redirected.url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Clipflow/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(15_000),
        redirect: 'manual',
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Could not reach URL: ${msg}` }
  }

  if (!res.ok) {
    return { ok: false, error: `Server returned ${res.status} for this URL.` }
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('html')) {
    return { ok: false, error: 'URL does not point to an HTML page.' }
  }

  const bounded = await readBoundedText(res, MAX_BYTES)
  if (!bounded.ok) return { ok: false, error: bounded.error }
  const html = bounded.text
  const root = parse(html)

  // Page title
  const title =
    root.querySelector('title')?.text?.trim() ||
    root.querySelector('h1')?.text?.trim() ||
    new URL(url).hostname

  // Remove noisy tags
  for (const tag of SKIP_TAGS) {
    root.querySelectorAll(tag).forEach((el) => el.remove())
  }

  // Prefer <article> or <main>, fall back to <body>
  const content =
    root.querySelector('article') ??
    root.querySelector('main') ??
    root.querySelector('body') ??
    root

  const text = content.text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  if (text.length < 50) {
    return {
      ok: false,
      error: 'Could not extract readable text from this page. It may require JavaScript to render.',
    }
  }

  return { ok: true, text: text.slice(0, 50_000), title }
}
