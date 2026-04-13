import 'server-only'

/**
 * Lists files from Google Drive.
 * Reuses the Google OAuth token from social_accounts or a user-provided token.
 */
export async function listDriveFiles(params: {
  accessToken: string
  query?: string
  mimeType?: string
  pageSize?: number
}): Promise<{ ok: true; files: Array<{ id: string; name: string; mimeType: string; size: string }> } | { ok: false; error: string }> {
  try {
    const q = params.query
      ? `name contains '${params.query}'`
      : params.mimeType
        ? `mimeType='${params.mimeType}'`
        : "mimeType='video/mp4' or mimeType='video/quicktime' or mimeType='application/vnd.google-apps.document'"

    const url = new URL('https://www.googleapis.com/drive/v3/files')
    url.searchParams.set('q', q)
    url.searchParams.set('pageSize', String(params.pageSize ?? 20))
    url.searchParams.set('fields', 'files(id,name,mimeType,size)')
    url.searchParams.set('orderBy', 'modifiedTime desc')

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${params.accessToken}` },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { ok: false, error: `Drive error ${res.status}` }
    const data = await res.json() as { files?: Array<{ id: string; name: string; mimeType: string; size: string }> }
    return { ok: true, files: data.files ?? [] }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Drive list failed' }
  }
}

/**
 * Downloads a file from Google Drive (returns a download URL).
 */
export async function getDriveFileUrl(params: {
  accessToken: string
  fileId: string
}): Promise<{ ok: true; downloadUrl: string } | { ok: false; error: string }> {
  // For Google Docs, export as plain text
  // For videos/files, get direct download link
  const url = `https://www.googleapis.com/drive/v3/files/${params.fileId}?alt=media`
  return { ok: true, downloadUrl: `${url}&access_token=${params.accessToken}` }
}
