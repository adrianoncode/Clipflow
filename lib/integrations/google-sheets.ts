import 'server-only'

/**
 * Appends rows to a Google Sheet.
 * Used for exporting analytics, content data, etc.
 */
export async function appendToSheet(params: {
  accessToken: string
  spreadsheetId: string
  range: string // e.g. 'Sheet1!A1'
  values: string[][]
}): Promise<{ ok: true; updatedRows: number } | { ok: false; error: string }> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/values/${params.range}:append?valueInputOption=USER_ENTERED`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: params.values }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { ok: false, error: `Sheets error ${res.status}` }
    const data = await res.json() as { updates?: { updatedRows?: number } }
    return { ok: true, updatedRows: data.updates?.updatedRows ?? 0 }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Sheets append failed' }
  }
}

/**
 * Creates a new Google Sheet with headers.
 */
export async function createSheet(params: {
  accessToken: string
  title: string
  headers: string[]
}): Promise<{ ok: true; spreadsheetId: string; url: string } | { ok: false; error: string }> {
  try {
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title: params.title },
        sheets: [{
          data: [{
            rowData: [{
              values: params.headers.map((h) => ({
                userEnteredValue: { stringValue: h },
                userEnteredFormat: { textFormat: { bold: true } },
              })),
            }],
          }],
        }],
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { ok: false, error: `Sheets error ${res.status}` }
    const data = await res.json() as { spreadsheetId?: string; spreadsheetUrl?: string }
    return { ok: true, spreadsheetId: data.spreadsheetId ?? '', url: data.spreadsheetUrl ?? '' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Sheet creation failed' }
  }
}
