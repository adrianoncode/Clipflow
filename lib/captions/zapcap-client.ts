import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

import { log } from '@/lib/log'

/**
 * Low-level ZapCap API client. All endpoints take an explicit `apiKey`
 * (BYOK) — the encrypted user key is decrypted upstream by the caller
 * via `getDecryptedAiKey(workspaceId, 'zapcap')`.
 *
 * Pattern mirrors `lib/highlights/detect-viral-moments.ts`: every call
 * returns a discriminated union `{ ok: true; ... } | { ok: false; error }`
 * so callers branch cleanly without throw/catch boilerplate. Network
 * errors and non-2xx responses both flow through the `ok: false` arm
 * with a user-readable message.
 *
 * Docs: https://platform.zapcap.ai/docs/
 */

const ZAPCAP_BASE = 'https://api.zapcap.ai'
const REQUEST_TIMEOUT_MS = 30_000

// Status values straight from the ZapCap docs. We keep both the
// remote enum (`ZapCapTaskStatus`) and our internal lifecycle
// (`queued | processing | ready | failed`) — `mapZapCapStatus` is
// the single source of truth for the mapping.
export type ZapCapTaskStatus =
  | 'pending'
  | 'transcribing'
  | 'transcriptionCompleted'
  | 'rendering'
  | 'completed'
  | 'failed'

export type CaptionRenderStatus = 'queued' | 'processing' | 'ready' | 'failed'

export function mapZapCapStatus(status: ZapCapTaskStatus): CaptionRenderStatus {
  switch (status) {
    case 'pending':
    case 'transcribing':
      return 'queued'
    case 'transcriptionCompleted':
    case 'rendering':
      return 'processing'
    case 'completed':
      return 'ready'
    case 'failed':
      return 'failed'
  }
}

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface ZapCapTemplate {
  id: string
  name: string
  /** Optional preview image — not all templates have one. */
  previewUrl?: string | null
}

export interface ZapCapTaskResponse {
  status: ZapCapTaskStatus
  id: string
  /** ZapCap CDN URL for the rendered MP4 — present once `status === 'completed'`. */
  downloadUrl?: string
  transcript?: string
  error?: string
}

export interface ZapCapWebhookPayload {
  eventId: string
  event: 'failed' | 'transcriptionCompleted' | 'completed' | 'rendering'
  taskId: string
  notificationFor: 'transcript' | 'render' | 'renderProgress'
  transcriptUrl?: string
  renderUrl?: string
  /** 0..1 — only on renderProgress. */
  progress?: number
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

/** Upload a video to ZapCap by URL — preferred over multipart upload
 *  because we already have signed Supabase Storage URLs for rendered
 *  clips, so there's no point re-streaming them through our server. */
export async function uploadVideoByUrl(params: {
  apiKey: string
  videoUrl: string
}): Promise<
  | { ok: true; videoId: string }
  | { ok: false; error: string }
> {
  const res = await zapcapFetch({
    apiKey: params.apiKey,
    method: 'POST',
    path: '/videos/url',
    body: { url: params.videoUrl },
  })
  if (!res.ok) return res

  const { id } = res.json as { id?: string }
  if (!id) return { ok: false, error: 'ZapCap upload missing video id.' }
  return { ok: true, videoId: id }
}

/** List the templates available in the user's ZapCap account. We fetch
 *  this on-demand for the style picker — IDs are account-scoped so
 *  there's no static map we can hard-code. */
export async function listTemplates(params: {
  apiKey: string
}): Promise<
  | { ok: true; templates: ZapCapTemplate[] }
  | { ok: false; error: string }
> {
  const res = await zapcapFetch({
    apiKey: params.apiKey,
    method: 'GET',
    path: '/templates',
  })
  if (!res.ok) return res

  const raw = res.json
  // The docs show templates returned as a top-level array. Be lenient
  // in case ZapCap evolves to wrap them under `{templates: [...]}`.
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { templates?: unknown }).templates)
      ? (raw as { templates: unknown[] }).templates
      : []

  const templates: ZapCapTemplate[] = []
  for (const t of list) {
    if (
      t &&
      typeof t === 'object' &&
      typeof (t as { id?: unknown }).id === 'string' &&
      typeof (t as { name?: unknown }).name === 'string'
    ) {
      const obj = t as { id: string; name: string; previewUrl?: unknown }
      templates.push({
        id: obj.id,
        name: obj.name,
        previewUrl:
          typeof obj.previewUrl === 'string' ? obj.previewUrl : null,
      })
    }
  }
  return { ok: true, templates }
}

/** Create a captioning task and ask ZapCap to call our webhook on
 *  completion. autoApprove=true skips the manual transcript-approval
 *  step since users come from the in-app review flow already. */
export async function createCaptioningTask(params: {
  apiKey: string
  videoId: string
  templateId: string
  webhookUrl: string
  language?: string
}): Promise<
  | { ok: true; taskId: string }
  | { ok: false; error: string }
> {
  const res = await zapcapFetch({
    apiKey: params.apiKey,
    method: 'POST',
    path: `/videos/${encodeURIComponent(params.videoId)}/task`,
    body: {
      templateId: params.templateId,
      autoApprove: true,
      language: params.language ?? 'en',
      notification: {
        type: 'webhook',
        notificationsFor: ['render'],
        recipient: params.webhookUrl,
      },
    },
  })
  if (!res.ok) return res

  const { taskId } = res.json as { taskId?: string }
  if (!taskId) return { ok: false, error: 'ZapCap task creation missing taskId.' }
  return { ok: true, taskId }
}

/** Polling fallback for tasks where the webhook never fires (network
 *  blip, dev tunnel down). Used by /api/cron/poll-zapcap on rows
 *  stuck in queued/processing > 5 min. */
export async function getTask(params: {
  apiKey: string
  videoId: string
  taskId: string
}): Promise<
  | { ok: true; task: ZapCapTaskResponse }
  | { ok: false; error: string }
> {
  const res = await zapcapFetch({
    apiKey: params.apiKey,
    method: 'GET',
    path: `/videos/${encodeURIComponent(params.videoId)}/task/${encodeURIComponent(params.taskId)}`,
  })
  if (!res.ok) return res

  return { ok: true, task: res.json as ZapCapTaskResponse }
}

// ----------------------------------------------------------------------------
// Webhook signature verification
// ----------------------------------------------------------------------------

/**
 * Verifies the `x-signature` header on an inbound ZapCap webhook.
 * Uses HMAC-SHA-256 with the user's webhook secret (stored encrypted
 * alongside the API key in the ai_keys row). Constant-time comparison
 * to avoid timing attacks.
 *
 * IMPORTANT: pass the RAW request body string, not the parsed JSON —
 * ZapCap signs the literal body bytes. JSON.stringify(parsed) would
 * normalize whitespace and break the signature.
 */
export function verifyWebhookSignature(params: {
  rawBody: string
  signatureHeader: string | null | undefined
  webhookSecret: string
}): boolean {
  const { rawBody, signatureHeader, webhookSecret } = params
  if (!signatureHeader || !webhookSecret) return false

  const expected = createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  // Both must be the same length for timingSafeEqual; bail otherwise
  // (a length mismatch is already a fail anyway).
  const provided = signatureHeader.trim()
  if (provided.length !== expected.length) return false

  try {
    return timingSafeEqual(
      Buffer.from(provided, 'utf8'),
      Buffer.from(expected, 'utf8'),
    )
  } catch {
    return false
  }
}

// ----------------------------------------------------------------------------
// Internal fetch wrapper — auth, timeout, error mapping all in one place.
// ----------------------------------------------------------------------------

interface ZapCapFetchParams {
  apiKey: string
  method: 'GET' | 'POST'
  path: string
  body?: unknown
}

type ZapCapFetchResult =
  | { ok: true; json: unknown }
  | { ok: false; error: string }

async function zapcapFetch(params: ZapCapFetchParams): Promise<ZapCapFetchResult> {
  const { apiKey, method, path, body } = params

  let response: Response
  try {
    response = await fetch(`${ZAPCAP_BASE}${path}`, {
      method,
      headers: {
        'x-api-key': apiKey,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'AbortError' || name === 'TimeoutError') {
      return { ok: false, error: 'ZapCap request timed out.' }
    }
    return { ok: false, error: 'Could not reach ZapCap.' }
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        error: 'ZapCap rejected this key. Update it in Settings → AI Keys.',
      }
    }
    if (response.status === 402) {
      return {
        ok: false,
        error: 'ZapCap account out of credits. Top up to keep rendering.',
      }
    }
    if (response.status === 429) {
      return { ok: false, error: 'ZapCap rate-limited us. Try again shortly.' }
    }
    let detail = ''
    try {
      detail = (await response.text()).slice(0, 200)
    } catch {
      // ignore
    }
    log.error('zapcap unexpected status', { path, status: response.status, detail })
    return { ok: false, error: `ZapCap error (${response.status}).` }
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    return { ok: false, error: 'ZapCap returned malformed JSON.' }
  }
  return { ok: true, json }
}
