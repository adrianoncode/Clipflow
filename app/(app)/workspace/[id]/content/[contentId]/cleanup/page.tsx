import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Eraser } from 'lucide-react'

import { CleanupClient } from '@/components/content/cleanup-client'
import { PageHeading } from '@/components/workspace/page-heading'
import { detectFillers } from '@/lib/cleanup/detect-fillers'
import { getContentItem } from '@/lib/content/get-content-item'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { createClient } from '@/lib/supabase/server'

interface CleanupPageProps {
  params: { id: string; contentId: string }
}

export const dynamic = 'force-dynamic'
// Detection runs in milliseconds; render submit is the long path. The
// initial server pass only does detection so a tight budget is fine.
export const maxDuration = 30

export async function generateMetadata({ params }: CleanupPageProps) {
  const item = await getContentItem(params.contentId, params.id)
  return {
    title: item?.title ? `Audio cleanup · ${item.title}` : 'Audio cleanup',
  }
}

export default async function CleanupPage({ params }: CleanupPageProps) {
  const member = await requireWorkspaceMember(params.id)
  if (!member.ok) notFound()

  const item = await getContentItem(params.contentId, params.id)
  if (!item) notFound()

  // Pull word timings — required for the entire feature. We render an
  // explanatory state below if they're missing.
  const supabase = createClient()
  const { data: row } = await supabase
    .from('content_items')
    .select('transcript_words, metadata')
    .eq('id', params.contentId)
    .maybeSingle()

  const words = extractWords(row)
  const savedCleanup = extractSavedCleanup(row)

  // Run an initial 'auto' detection so the editor has something to
  // render at first paint — the user can switch language and re-detect
  // via the analyze action without a page reload.
  const initial = words.length > 0 ? detectFillers(words, 'auto') : null

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <nav
        className="flex flex-wrap items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85"
        aria-label="Breadcrumb"
      >
        <Link
          href={`/workspace/${params.id}`}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          Content
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <Link
          href={`/workspace/${params.id}/content/${params.contentId}`}
          className="max-w-[220px] truncate rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          {item.title ?? 'Untitled'}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <span className="rounded-md px-1.5 py-0.5 font-semibold text-foreground">
          Audio cleanup
        </span>
      </nav>

      <PageHeading
        eyebrow={`AI · Audio cleanup`}
        title={
          <span className="flex items-baseline gap-3">
            Trim the “ums” out.
            <Eraser className="h-6 w-6 text-primary/40" aria-hidden />
          </span>
        }
        body={
          words.length === 0
            ? 'Word-level timings are missing for this video — re-transcribe to enable cleanup.'
            : initial
              ? `Found ${initial.hits.length} filler word${initial.hits.length === 1 ? '' : 's'} in the transcript${
                  initial.totalSavingsSeconds > 0
                    ? ` · cutting them all saves ${formatSeconds(initial.totalSavingsSeconds)}.`
                    : '.'
                }`
              : 'Pick a language and re-analyze to detect fillers.'
        }
      />

      {words.length === 0 ? (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-6 text-sm text-amber-900">
          <p className="font-semibold">Transcript not detailed enough</p>
          <p className="mt-1 text-xs opacity-80">
            Audio cleanup uses Whisper&rsquo;s word-level timings. The transcript
            on this item was generated without timings — head back to{' '}
            <Link
              href={`/workspace/${params.id}/content/${params.contentId}`}
              className="font-semibold underline"
            >
              the content page
            </Link>{' '}
            and re-run transcription to enable cleanup.
          </p>
        </div>
      ) : (
        <CleanupClient
          workspaceId={params.id}
          contentId={params.contentId}
          words={words}
          initial={initial}
          savedCutIndices={savedCleanup.cutIndices}
          savedLanguage={savedCleanup.language}
        />
      )}
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────

function extractWords(
  row:
    | { transcript_words?: unknown; metadata?: unknown }
    | null
    | undefined,
): Array<{ word: string; start: number; end: number }> {
  if (!row) return []
  const direct = (row as { transcript_words?: unknown }).transcript_words
  const fromColumn = normaliseWords(direct)
  if (fromColumn) return fromColumn
  const meta = (row as { metadata?: unknown }).metadata
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const fromMeta = normaliseWords(
      (meta as Record<string, unknown>).word_timestamps,
    )
    if (fromMeta) return fromMeta
  }
  return []
}

function normaliseWords(
  raw: unknown,
): Array<{ word: string; start: number; end: number }> | null {
  if (!Array.isArray(raw)) return null
  const out: Array<{ word: string; start: number; end: number }> = []
  for (const e of raw) {
    if (!e || typeof e !== 'object') continue
    const r = e as Record<string, unknown>
    const word = typeof r.word === 'string' ? r.word : null
    const start = typeof r.start === 'number' ? r.start : null
    const end = typeof r.end === 'number' ? r.end : null
    if (!word || start === null || end === null) continue
    out.push({ word, start, end })
  }
  return out.length > 0 ? out : null
}

function extractSavedCleanup(
  row:
    | { metadata?: unknown }
    | null
    | undefined,
): { cutIndices: number[]; language: string | null } {
  if (!row) return { cutIndices: [], language: null }
  const meta = row.metadata
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return { cutIndices: [], language: null }
  }
  const cleanup = (meta as Record<string, unknown>).cleanup as
    | Record<string, unknown>
    | undefined
  if (!cleanup || typeof cleanup !== 'object') {
    return { cutIndices: [], language: null }
  }
  const rawIdx = cleanup.cutIndices
  const cutIndices = Array.isArray(rawIdx)
    ? rawIdx
        .map((n) => (typeof n === 'number' ? n : Number.NaN))
        .filter((n) => Number.isFinite(n))
    : []
  const language = typeof cleanup.language === 'string' ? cleanup.language : null
  return { cutIndices, language }
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}m ${sec}s`
}
