import 'server-only'

/**
 * Publishes a post to WordPress via REST API.
 * Uses Application Passwords (WordPress 5.6+) or basic auth.
 */
export async function publishToWordPress(params: {
  siteUrl: string
  username: string
  applicationPassword: string
  title: string
  content: string
  status?: 'publish' | 'draft'
  categories?: number[]
  tags?: number[]
}): Promise<{ ok: true; postUrl: string; postId: number } | { ok: false; error: string }> {
  try {
    const apiUrl = `${params.siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`
    const auth = Buffer.from(`${params.username}:${params.applicationPassword}`).toString('base64')

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: params.title,
        content: params.content,
        status: params.status ?? 'draft',
        categories: params.categories,
        tags: params.tags,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `WordPress error ${res.status}: ${err.slice(0, 200)}` }
    }

    const data = await res.json() as { id?: number; link?: string }
    return { ok: true, postUrl: data.link ?? '', postId: data.id ?? 0 }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'WordPress publish failed' }
  }
}
