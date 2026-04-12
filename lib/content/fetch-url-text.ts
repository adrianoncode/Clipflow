import 'server-only'

import { parse } from 'node-html-parser'

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
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Clipflow/1.0; +https://clipflow.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15_000),
    })
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

  const html = await res.text()
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
