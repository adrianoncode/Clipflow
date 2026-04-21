'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'
import { transcribe } from '@/lib/ai/transcription/transcribe'
import type { TranscriptionErrorCode } from '@/lib/ai/transcription/types'
import { getUser } from '@/lib/auth/get-user'
import { checkLimit } from '@/lib/billing/check-limit'
import { createContentItem } from '@/lib/content/create-content-item'
import {
  createRssSchema,
  createTextSchema,
  createUrlSchema,
  createVideoSchema,
  createYoutubeSchema,
  MAX_VIDEO_BYTES,
  retryTranscriptionSchema,
  startTranscriptionSchema,
} from '@/lib/content/schemas'
import { fetchRssFeed } from '@/lib/content/fetch-rss-feed'
import { fetchYoutubeTranscript } from '@/lib/content/fetch-youtube-transcript'
import { fetchUrlText } from '@/lib/content/fetch-url-text'
import { mimeForExtension, videoStoragePath } from '@/lib/content/storage-paths'
import { updateContentItem } from '@/lib/content/update-content-item'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import { triggerWebhooks } from '@/lib/webhooks/trigger-webhook'

// NOTE: `maxDuration = 300` lives on the route segments that invoke these
// actions (new/page.tsx and [contentId]/page.tsx). Server Action modules
// may only export async functions, so the const lives where Next.js
// actually reads it — the page segment config.

// ---------------------------------------------------------------------------
// Types shared with the client forms
// ---------------------------------------------------------------------------

export type CreateVideoResult =
  | { ok: true; contentId: string }
  | { ok: false; error: string }

export type StartTranscriptionResult =
  | { ok: true }
  | { ok: false; code: TranscriptionErrorCode | 'no_key' | 'already_processing' | 'unknown'; error: string }

export type RetryTranscriptionState =
  | { ok?: undefined; error?: string }
  | { ok: true }
  | { ok: false; error: string }

export type TextFormState = { error?: string }

// ---------------------------------------------------------------------------
// Video — Step 1: insert content_items row
// ---------------------------------------------------------------------------

export async function createVideoContentAction(
  _prev: CreateVideoResult,
  formData: FormData,
): Promise<CreateVideoResult> {
  const parsed = createVideoSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    filename: formData.get('filename'),
    ext: formData.get('ext'),
    file_size: formData.get('file_size'),
    mime_type: formData.get('mime_type') ?? '',
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const limit = await checkLimit(parsed.data.workspace_id, 'content_items')
  if (!limit.ok) {
    return { ok: false, error: limit.message ?? 'Monthly content limit reached. Upgrade your plan.' }
  }

  const dotIndex = parsed.data.filename.lastIndexOf('.')
  const title = dotIndex > 0 ? parsed.data.filename.slice(0, dotIndex) : parsed.data.filename

  const result = await createContentItem({
    workspaceId: parsed.data.workspace_id,
    kind: 'video',
    title,
    status: 'uploading',
    metadata: {
      mime_type:
        parsed.data.mime_type && parsed.data.mime_type.length > 0
          ? parsed.data.mime_type
          : mimeForExtension(parsed.data.ext),
      file_size: parsed.data.file_size,
      original_filename: parsed.data.filename,
    },
    createdBy: user.id,
  })

  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  revalidatePath(`/workspace/${parsed.data.workspace_id}`)
  return { ok: true, contentId: result.id }
}

// ---------------------------------------------------------------------------
// Video — Step 3: download from storage + Whisper + persist transcript
// ---------------------------------------------------------------------------

async function runTranscription(params: {
  workspaceId: string
  contentId: string
  ext: (typeof createVideoSchema._type)['ext']
}): Promise<StartTranscriptionResult> {
  const path = videoStoragePath(params.workspaceId, params.contentId, params.ext)

  // Atomic transition uploading -> processing. If the predicate fails we
  // assume another caller already started transcription and bail.
  const transition = await updateContentItem(
    params.contentId,
    params.workspaceId,
    { source_url: path, status: 'processing' },
    { status: 'uploading' },
  )
  if (!transition.ok) {
    return {
      ok: false,
      code: 'already_processing',
      error: 'This content is already being transcribed.',
    }
  }

  async function fail(
    code: TranscriptionErrorCode | 'no_key',
    message: string,
  ): Promise<StartTranscriptionResult> {
    await updateContentItem(params.contentId, params.workspaceId, {
      status: 'failed',
      metadata: { error: { code, message } },
    })
    revalidatePath(`/workspace/${params.workspaceId}/content/${params.contentId}`)
    revalidatePath(`/workspace/${params.workspaceId}`)
    return { ok: false, code, error: message }
  }

  const key = await getDecryptedAiKey(params.workspaceId, 'openai')
  if (!key.ok) {
    if (key.code === 'no_key') {
      return fail(
        'no_key',
        'No OpenAI key saved for this workspace. Add one in Settings → AI Keys and retry.',
      )
    }
    return fail('provider_error', key.message)
  }

  const supabase = createClient()
  const { data: blob, error: downloadError } = await supabase.storage
    .from('content')
    .download(path)
  if (downloadError || !blob) {
    return fail(
      'provider_error',
      downloadError?.message ?? 'Could not read the uploaded file.',
    )
  }

  if (blob.size > MAX_VIDEO_BYTES) {
    return fail('file_too_large', 'This file exceeds the 25MB Whisper limit.')
  }

  const filename = `source.${params.ext}`
  const mimeType = mimeForExtension(params.ext)
  const result = await transcribe({
    provider: 'openai',
    apiKey: key.plaintext,
    blob,
    filename,
    mimeType,
  })

  if (!result.ok) {
    return fail(result.code, result.message)
  }

  // Store duration from Whisper when available — editor exports (EDL,
  // chapters) use it for real timestamps instead of 300s fallback.
  let mergedMetadata: { [key: string]: Json | undefined } | undefined
  if (result.durationSeconds != null) {
    // Read existing metadata first so we merge instead of overwrite
    const { data: existing } = await supabase
      .from('content_items')
      .select('metadata')
      .eq('id', params.contentId)
      .eq('workspace_id', params.workspaceId)
      .maybeSingle()
    const prev =
      existing?.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {}
    mergedMetadata = { ...prev, duration_seconds: result.durationSeconds }
  }

  const ready = await updateContentItem(params.contentId, params.workspaceId, {
    transcript: result.text,
    status: 'ready',
    ...(mergedMetadata ? { metadata: mergedMetadata } : {}),
  })
  if (!ready.ok) {
    return fail('provider_error', ready.error)
  }

  revalidatePath(`/workspace/${params.workspaceId}/content/${params.contentId}`)
  revalidatePath(`/workspace/${params.workspaceId}`)

  // Fire-and-forget webhook for content.ready
  triggerWebhooks(params.workspaceId, 'content.ready', {
    content_id: params.contentId,
    kind: 'video',
    title: 'Transcription complete',
  })

  return { ok: true }
}

export async function startTranscriptionAction(
  _prev: StartTranscriptionResult,
  formData: FormData,
): Promise<StartTranscriptionResult> {
  const parsed = startTranscriptionSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    ext: formData.get('ext'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      code: 'unknown',
      error: parsed.error.issues[0]?.message ?? 'Invalid input.',
    }
  }

  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  return runTranscription({
    workspaceId: parsed.data.workspace_id,
    contentId: parsed.data.content_id,
    ext: parsed.data.ext,
  })
}

// ---------------------------------------------------------------------------
// Video — Retry from failed state
// ---------------------------------------------------------------------------

export async function retryTranscriptionAction(
  _prev: RetryTranscriptionState,
  formData: FormData,
): Promise<RetryTranscriptionState> {
  const parsed = retryTranscriptionSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('content_items')
    .select('source_url, status')
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)
    .maybeSingle()

  if (error || !row) {
    return { ok: false, error: 'Content item not found.' }
  }
  if (row.status !== 'failed') {
    return { ok: false, error: 'Only failed items can be retried.' }
  }
  if (!row.source_url) {
    return { ok: false, error: 'No source file to retry.' }
  }

  const ext = row.source_url.split('.').pop()?.toLowerCase()
  if (!ext) {
    return { ok: false, error: 'Could not determine file extension.' }
  }

  // Reset to uploading so runTranscription's optimistic predicate passes.
  const reset = await updateContentItem(
    parsed.data.content_id,
    parsed.data.workspace_id,
    { status: 'uploading', metadata: {} },
    { status: 'failed' },
  )
  if (!reset.ok) {
    return { ok: false, error: 'Could not reset item for retry.' }
  }

  const result = await runTranscription({
    workspaceId: parsed.data.workspace_id,
    contentId: parsed.data.content_id,
    ext: ext as (typeof createVideoSchema._type)['ext'],
  })

  if (!result.ok) {
    return { ok: false, error: result.error }
  }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Text — single action that redirects on success
// ---------------------------------------------------------------------------

export async function createTextContentAction(
  _prev: TextFormState,
  formData: FormData,
): Promise<TextFormState> {
  const parsed = createTextSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    title: formData.get('title') ?? undefined,
    body: formData.get('body'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const limit = await checkLimit(parsed.data.workspace_id, 'content_items')
  if (!limit.ok) {
    return { error: limit.message ?? 'Monthly content limit reached. Upgrade your plan.' }
  }

  const result = await createContentItem({
    workspaceId: parsed.data.workspace_id,
    kind: 'text',
    title: parsed.data.title ?? 'Untitled',
    status: 'ready',
    transcript: parsed.data.body,
    createdBy: user.id,
  })

  if (!result.ok) {
    return { error: result.error }
  }

  revalidatePath(`/workspace/${parsed.data.workspace_id}`)
  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${result.id}`)

  // Fire-and-forget webhook for content.ready
  triggerWebhooks(parsed.data.workspace_id, 'content.ready', {
    content_id: result.id,
    kind: 'text',
    title: parsed.data.title ?? 'Untitled',
  })

  redirect(`/workspace/${parsed.data.workspace_id}/content/${result.id}`)
}

// ---------------------------------------------------------------------------
// YouTube URL — fetch captions + store as ready content item
// ---------------------------------------------------------------------------

export type YoutubeFormState = { error?: string }

export async function createYoutubeContentAction(
  _prev: YoutubeFormState,
  formData: FormData,
): Promise<YoutubeFormState> {
  const parsed = createYoutubeSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    url: formData.get('url'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const limit = await checkLimit(parsed.data.workspace_id, 'content_items')
  if (!limit.ok) {
    return { error: limit.message ?? 'Monthly content limit reached. Upgrade your plan.' }
  }

  const fetched = await fetchYoutubeTranscript(parsed.data.url)
  if (!fetched.ok) {
    return { error: fetched.error }
  }

  const result = await createContentItem({
    workspaceId: parsed.data.workspace_id,
    kind: 'youtube',
    title: fetched.title,
    status: 'ready',
    transcript: fetched.transcript,
    sourceUrl: parsed.data.url,
    createdBy: user.id,
  })

  if (!result.ok) {
    return { error: result.error }
  }

  revalidatePath(`/workspace/${parsed.data.workspace_id}`)

  // Fire-and-forget webhook for content.ready
  triggerWebhooks(parsed.data.workspace_id, 'content.ready', {
    content_id: result.id,
    kind: 'youtube',
    title: fetched.title,
  })

  redirect(`/workspace/${parsed.data.workspace_id}/content/${result.id}`)
}

// ---------------------------------------------------------------------------
// Website/Blog URL — scrape text + store as ready content item
// ---------------------------------------------------------------------------

export type UrlFormState = { error?: string }

export async function createUrlContentAction(
  _prev: UrlFormState,
  formData: FormData,
): Promise<UrlFormState> {
  const parsed = createUrlSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    url: formData.get('url'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const limit = await checkLimit(parsed.data.workspace_id, 'content_items')
  if (!limit.ok) {
    return { error: limit.message ?? 'Monthly content limit reached. Upgrade your plan.' }
  }

  const fetched = await fetchUrlText(parsed.data.url)
  if (!fetched.ok) {
    return { error: fetched.error }
  }

  const result = await createContentItem({
    workspaceId: parsed.data.workspace_id,
    kind: 'url',
    title: fetched.title,
    status: 'ready',
    transcript: fetched.text,
    sourceUrl: parsed.data.url,
    createdBy: user.id,
  })

  if (!result.ok) {
    return { error: result.error }
  }

  revalidatePath(`/workspace/${parsed.data.workspace_id}`)

  // Fire-and-forget webhook for content.ready
  triggerWebhooks(parsed.data.workspace_id, 'content.ready', {
    content_id: result.id,
    kind: 'url',
    title: fetched.title,
  })

  redirect(`/workspace/${parsed.data.workspace_id}/content/${result.id}`)
}

// ---------------------------------------------------------------------------
// Podcast RSS Feed — fetch latest episode description + optional audio URL
// ---------------------------------------------------------------------------

export type RssFormState = { error?: string }

export async function createRssContentAction(
  _prev: RssFormState,
  formData: FormData,
): Promise<RssFormState> {
  const parsed = createRssSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    url: formData.get('url'),
    watch_feed: formData.get('watch_feed') ?? '',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const limit = await checkLimit(parsed.data.workspace_id, 'content_items')
  if (!limit.ok) {
    return { error: limit.message ?? 'Monthly content limit reached. Upgrade your plan.' }
  }

  const fetched = await fetchRssFeed(parsed.data.url)
  if (!fetched.ok) {
    return { error: fetched.error }
  }

  const result = await createContentItem({
    workspaceId: parsed.data.workspace_id,
    kind: 'rss',
    title: `${fetched.title} — ${fetched.episodeTitle}`,
    status: 'ready',
    transcript: fetched.text,
    sourceUrl: parsed.data.url,
    createdBy: user.id,
  })

  if (!result.ok) {
    return { error: result.error }
  }

  // Optional subscription — if the user ticked "watch this feed", we
  // upsert an rss_subscriptions row so the daily poll-rss cron imports
  // new episodes automatically. Uses the feed's current latest guid as
  // the initial high-water mark so we don't re-import the episode we
  // just created above.
  if (parsed.data.watch_feed) {
    try {
      const { fetchRssFeedAll } = await import('@/lib/content/fetch-rss-feed')
      const supabase = createClient()
      const all = await fetchRssFeedAll(parsed.data.url)
      const latestGuid = all.ok ? all.episodes[0]?.guid ?? null : null

      await supabase.from('rss_subscriptions').upsert(
        {
          workspace_id: parsed.data.workspace_id,
          feed_url: parsed.data.url,
          channel_title: fetched.title,
          last_seen_guid: latestGuid,
          created_by: user.id,
        } as never,
        { onConflict: 'workspace_id,feed_url' },
      )
    } catch {
      // Subscription is optional — don't fail the import if the upsert
      // errors. User can retry from a future import.
    }
  }

  revalidatePath(`/workspace/${parsed.data.workspace_id}`)

  // Fire-and-forget webhook for content.ready
  triggerWebhooks(parsed.data.workspace_id, 'content.ready', {
    content_id: result.id,
    kind: 'rss',
    title: `${fetched.title} — ${fetched.episodeTitle}`,
  })

  redirect(`/workspace/${parsed.data.workspace_id}/content/${result.id}`)
}
