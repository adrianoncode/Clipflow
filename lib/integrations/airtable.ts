import 'server-only'

/**
 * Creates a record in an Airtable base.
 * User provides their Personal Access Token + Base ID + Table name.
 */
export async function createAirtableRecord(params: {
  apiKey: string
  baseId: string
  tableName: string
  fields: Record<string, unknown>
}): Promise<{ ok: true; recordId: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`https://api.airtable.com/v0/${params.baseId}/${encodeURIComponent(params.tableName)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: params.fields }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `Airtable error ${res.status}: ${err.slice(0, 200)}` }
    }

    const data = await res.json() as { id?: string }
    return { ok: true, recordId: data.id ?? '' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Airtable create failed' }
  }
}

/**
 * Lists records from an Airtable table.
 */
export async function listAirtableRecords(params: {
  apiKey: string
  baseId: string
  tableName: string
  maxRecords?: number
}): Promise<{ ok: true; records: Array<{ id: string; fields: Record<string, unknown> }> } | { ok: false; error: string }> {
  try {
    const url = new URL(`https://api.airtable.com/v0/${params.baseId}/${encodeURIComponent(params.tableName)}`)
    url.searchParams.set('maxRecords', String(params.maxRecords ?? 20))

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${params.apiKey}` },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { ok: false, error: `Airtable error ${res.status}` }
    const data = await res.json() as { records?: Array<{ id: string; fields: Record<string, unknown> }> }
    return { ok: true, records: data.records ?? [] }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Airtable list failed' }
  }
}
