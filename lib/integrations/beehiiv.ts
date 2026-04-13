import 'server-only'

/**
 * Creates a draft post in Beehiiv via their REST API.
 * User provides their Beehiiv API key and publication ID.
 */
export async function publishToBeehiiv(params: {
  apiKey: string
  publicationId: string
  title: string
  subtitle?: string
  content: string // HTML content
  status?: 'draft' | 'confirmed'
}): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`https://api.beehiiv.com/v2/publications/${params.publicationId}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: params.title,
        subtitle: params.subtitle,
        content_html: params.content,
        status: params.status ?? 'draft',
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `Beehiiv error ${res.status}: ${err.slice(0, 200)}` }
    }

    const data = await res.json() as { data?: { id?: string } }
    return { ok: true, postId: data.data?.id ?? '' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Beehiiv publish failed' }
  }
}
