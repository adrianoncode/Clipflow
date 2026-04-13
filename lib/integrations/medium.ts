import 'server-only'

/**
 * Publishes a post to Medium via their REST API.
 * User provides their Medium Integration Token.
 */
export async function publishToMedium(params: {
  integrationToken: string
  title: string
  content: string // HTML or Markdown
  contentFormat?: 'html' | 'markdown'
  tags?: string[]
  publishStatus?: 'public' | 'draft' | 'unlisted'
}): Promise<{ ok: true; postUrl: string } | { ok: false; error: string }> {
  try {
    // Step 1: Get the authenticated user ID
    const meRes = await fetch('https://api.medium.com/v1/me', {
      headers: { Authorization: `Bearer ${params.integrationToken}` },
    })
    if (!meRes.ok) return { ok: false, error: 'Invalid Medium token' }
    const me = await meRes.json() as { data?: { id?: string } }
    const userId = me.data?.id
    if (!userId) return { ok: false, error: 'Could not get Medium user ID' }

    // Step 2: Create the post
    const res = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.integrationToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: params.title,
        contentFormat: params.contentFormat ?? 'html',
        content: params.content,
        tags: params.tags?.slice(0, 5),
        publishStatus: params.publishStatus ?? 'draft',
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `Medium error ${res.status}: ${err.slice(0, 200)}` }
    }

    const data = await res.json() as { data?: { url?: string } }
    return { ok: true, postUrl: data.data?.url ?? '' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Medium publish failed' }
  }
}
