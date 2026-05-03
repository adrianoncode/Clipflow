import 'server-only'

import { Composio } from '@composio/core'

/**
 * Composio v3 wrapper. The old v2 SDK (`composio-core`) was deprecated
 * when the /api/v2/* endpoints returned 410 — this module talks to
 * v3 via `@composio/core`.
 *
 * Architecture:
 *   1. One Composio client per process (singleton)
 *   2. AuthConfigs are project-level and reusable. We lazy-create one
 *      per toolkit on first use and cache the ID in memory.
 *   3. userId in Composio = our workspaceId (multitenancy boundary)
 *   4. connectedAccounts.link() returns the OAuth redirect URL
 *   5. tools.execute() runs an action with the user's connection.
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
 * Maps our internal channel IDs to Composio v3 toolkit slugs (lowercase).
 * Used by /settings/channels to OAuth into publishing destinations.
 */
export const COMPOSIO_APP_SLUGS: Record<string, string> = {
  linkedin:         'linkedin',
  youtube:          'youtube',
  instagram:        'instagram',
  facebook:         'facebook',
  // X (Twitter) intentionally excluded — Composio has no managed OAuth
  // credentials for it. Adding it requires bringing our own X Dev App
  // ($100/mo Basic) and using `type: 'use_custom_auth'` here.
}

export function isComposioOAuth(integrationId: string): boolean {
  return integrationId in COMPOSIO_APP_SLUGS
}

// ---------------------------------------------------------------------------
// Auth config cache — one per toolkit, reused across all workspaces.
// ---------------------------------------------------------------------------

const _authConfigCache = new Map<string, string>()

/**
 * Get-or-create a project-level auth config for a toolkit using
 * Composio's managed OAuth. Returns the auth config ID.
 */
async function getAuthConfigId(toolkit: string): Promise<string> {
  const cached = _authConfigCache.get(toolkit)
  if (cached) return cached

  const client = getComposioClient()

  // Shape notes: Composio v3 responses sometimes wrap arrays under
  // `items`, sometimes `data` — both are tolerated via dual-read. The
  // `unknown` cast narrows one field at a time without `any` leaking.
  //
  // BUG FIX (2026-05-03): Composio's `authConfigs.list({ toolkit })`
  // server-side filter is broken — it returns *all* auth configs across
  // every toolkit. The previous code took `items[0]` blindly and cached
  // it as the toolkit's auth config, so e.g. requesting `pinterest`
  // would cache Facebook's config and redirect users into Facebook
  // OAuth. Filter client-side by `toolkit.slug` to be safe.
  type LooseListItem = { id?: string; toolkit?: { slug?: string } }
  type LooseList = { items?: LooseListItem[]; data?: LooseListItem[] }
  type LooseCreate = { id?: string; authConfig?: { id?: string } }

  // Try listing first — we might already have one from a prior session.
  try {
    const existing = (await client.authConfigs.list({ toolkit })) as LooseList
    const items = existing?.items ?? existing?.data ?? []
    for (const item of items) {
      const id = item?.id
      const slug = item?.toolkit?.slug
      if (typeof id === 'string' && id.length > 0 && slug === toolkit) {
        _authConfigCache.set(toolkit, id)
        return id
      }
    }
  } catch { /* fall through to create */ }

  const created = (await client.authConfigs.create(toolkit, {
    type: 'use_composio_managed_auth',
    name: `${toolkit} via Clipflow`,
  })) as LooseCreate
  const id = created?.id ?? created?.authConfig?.id
  if (!id) throw new Error(`Composio: authConfigs.create returned no id for ${toolkit}`)
  _authConfigCache.set(toolkit, id)
  return id
}

// ---------------------------------------------------------------------------
// Public API — used by /api/integrations/connect and publish paths
// ---------------------------------------------------------------------------

/**
 * Start an OAuth flow for a workspace + integration. Returns the URL
 * to redirect the user to.
 */
export async function initiateComposioConnection(
  workspaceId: string,
  integrationId: string,
): Promise<{ redirectUrl: string } | { error: string }> {
  const toolkit = COMPOSIO_APP_SLUGS[integrationId]
  if (!toolkit) return { error: `Unknown integration: ${integrationId}` }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clipflow.to'
  const callbackUrl = `${appUrl}/api/integrations/callback`

  try {
    const client = getComposioClient()
    const authConfigId = await getAuthConfigId(toolkit)
    const connectionRequest = (await client.connectedAccounts.link(
      workspaceId,
      authConfigId,
      { callbackUrl },
    )) as { redirectUrl?: string }
    const redirectUrl = connectionRequest?.redirectUrl
    if (!redirectUrl) {
      return { error: `Composio returned no redirectUrl for ${toolkit}.` }
    }
    return { redirectUrl }
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Unknown Composio error'
    return { error: `Composio error: ${msg}` }
  }
}

/**
 * Fetch all active Composio connections for a workspace, returned as
 * a Set of our internal integration IDs.
 */
export async function getComposioConnections(
  workspaceId: string,
): Promise<Set<string>> {
  try {
    const client = getComposioClient()
    type LooseConn = {
      toolkit?: { slug?: string }
      toolkitSlug?: string
      appName?: string
    }
    type LooseListResp = { items?: LooseConn[]; data?: LooseConn[] }
    const resp = (await client.connectedAccounts.list({
      userIds: [workspaceId],
    })) as LooseListResp
    const items = resp?.items ?? resp?.data ?? []
    const toolkitToId = Object.fromEntries(
      Object.entries(COMPOSIO_APP_SLUGS).map(([id, slug]) => [slug, id]),
    )
    const connected = new Set<string>()
    for (const conn of items) {
      const toolkit = String(
        conn?.toolkit?.slug ?? conn?.toolkitSlug ?? conn?.appName ?? '',
      ).toLowerCase()
      const id = toolkitToId[toolkit]
      if (id) connected.add(id)
    }
    return connected
  } catch {
    return new Set()
  }
}

/**
 * Execute a Composio tool on behalf of a workspace. Thin wrapper around
 * `client.tools.execute()` with our standard error shape.
 */
export async function executeComposioAction(
  workspaceId: string,
  toolSlug: string,
  toolArguments: Record<string, unknown>,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const client = getComposioClient()
    const result = await client.tools.execute(toolSlug, {
      userId: workspaceId,
      arguments: toolArguments,
    })
    return { ok: true, data: result }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
