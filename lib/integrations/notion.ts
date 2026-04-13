import 'server-only'

/**
 * Creates a page in a Notion database via their REST API.
 * User provides their Notion Internal Integration Token + Database ID.
 */
export async function createNotionPage(params: {
  apiKey: string
  databaseId: string
  title: string
  content: string
  properties?: Record<string, unknown>
}): Promise<{ ok: true; pageId: string; pageUrl: string } | { ok: false; error: string }> {
  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: params.databaseId },
        properties: {
          Name: { title: [{ text: { content: params.title } }] },
          ...params.properties,
        },
        children: splitToNotionBlocks(params.content),
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `Notion error ${res.status}: ${err.slice(0, 200)}` }
    }

    const data = await res.json() as { id?: string; url?: string }
    return { ok: true, pageId: data.id ?? '', pageUrl: data.url ?? '' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Notion create failed' }
  }
}

/** Splits text content into Notion paragraph blocks */
function splitToNotionBlocks(content: string): Array<Record<string, unknown>> {
  return content.split('\n\n').filter(Boolean).slice(0, 100).map((paragraph) => ({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: paragraph.slice(0, 2000) } }],
    },
  }))
}

/**
 * Fetches pages from a Notion database (for importing content ideas).
 */
export async function queryNotionDatabase(params: {
  apiKey: string
  databaseId: string
  pageSize?: number
}): Promise<{ ok: true; pages: Array<{ id: string; title: string }> } | { ok: false; error: string }> {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${params.databaseId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: params.pageSize ?? 20 }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return { ok: false, error: `Notion error ${res.status}` }

    const data = await res.json() as {
      results?: Array<{
        id: string
        properties?: Record<string, { title?: Array<{ plain_text?: string }> }>
      }>
    }

    const pages = (data.results ?? []).map((p) => {
      const titleProp = Object.values(p.properties ?? {}).find((v) => v.title)
      const title = titleProp?.title?.[0]?.plain_text ?? 'Untitled'
      return { id: p.id, title }
    })

    return { ok: true, pages }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Notion query failed' }
  }
}
