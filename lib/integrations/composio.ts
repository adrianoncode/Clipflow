import 'server-only'

import { Composio } from 'composio-core'

/**
 * Singleton Composio client. Uses the platform's own API key —
 * users never touch Composio directly. Each workspace gets its own
 * "entity" in Composio, which scopes all OAuth connections.
 */
let _client: Composio | null = null

export function getComposioClient(): Composio {
  if (!_client) {
    const apiKey = process.env.COMPOSIO_API_KEY
    if (!apiKey) throw new Error('COMPOSIO_API_KEY is not set.')
    _client = new Composio({ apiKey })
  }
  return _client
}

/**
 * Maps our internal integration IDs to Composio app slugs.
 * Only integrations that use the Composio OAuth flow are listed here.
 */
export const COMPOSIO_APP_SLUGS: Record<string, string> = {
  notion:         'NOTION',
  'google-drive': 'GOOGLEDRIVE',
  'google-sheets':'GOOGLESHEETS',
  airtable:       'AIRTABLE',
  youtube:        'YOUTUBE',
  linkedin:       'LINKEDIN',
}

export function isComposioOAuth(integrationId: string): boolean {
  return integrationId in COMPOSIO_APP_SLUGS
}

/**
 * Starts an OAuth connection for a workspace + integration.
 * Returns the URL to redirect the user to.
 */
export async function initiateComposioConnection(
  workspaceId: string,
  integrationId: string,
): Promise<{ redirectUrl: string } | { error: string }> {
  const appSlug = COMPOSIO_APP_SLUGS[integrationId]
  if (!appSlug) return { error: `Unknown integration: ${integrationId}` }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/integrations/callback`

  try {
    const client = getComposioClient()
    const entity = client.getEntity(workspaceId)
    const connection = await entity.initiateConnection({
      appName: appSlug,
      redirectUri,
    })
    // @ts-expect-error — SDK type doesn't expose redirectUrl but it's in the response
    const redirectUrl = connection.redirectUrl ?? connection.connectionStatus?.redirectUrl
    if (!redirectUrl) return { error: 'Composio did not return a redirect URL.' }
    return { redirectUrl }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

/**
 * Fetches all active Composio connections for a workspace.
 * Returns a Set of integration IDs (our internal keys) that are connected.
 */
export async function getComposioConnections(
  workspaceId: string,
): Promise<Set<string>> {
  try {
    const client = getComposioClient()
    const entity = client.getEntity(workspaceId)
    const connections = await entity.getConnections()
    const slugToId = Object.fromEntries(
      Object.entries(COMPOSIO_APP_SLUGS).map(([id, slug]) => [slug, id]),
    )
    const connected = new Set<string>()
    for (const conn of connections ?? []) {
      // @ts-expect-error — SDK type varies
      const appName = (conn.appName ?? conn.app ?? '').toUpperCase()
      const id = slugToId[appName]
      if (id) connected.add(id)
    }
    return connected
  } catch {
    return new Set()
  }
}

/**
 * Execute a Composio action on behalf of a workspace.
 *
 * @example
 * await executeComposioAction(workspaceId, 'NOTION_CREATE_PAGE', { title, content })
 */
export async function executeComposioAction(
  workspaceId: string,
  actionName: string,
  params: Record<string, unknown>,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const client = getComposioClient()
    const entity = client.getEntity(workspaceId)
    const result = await entity.execute({ actionName, params })
    return { ok: true, data: result }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
