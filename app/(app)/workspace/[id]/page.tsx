import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  Wand2,
} from 'lucide-react'

import { ContentListWithSearch } from '@/components/content/content-list-with-search'
import { RecentImportsStrip } from '@/components/content/recent-imports-strip'
import { SmartImportBox } from '@/components/content/smart-import-box'
import { CreateStepper } from '@/components/create/create-stepper'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getContentItems, getLatestContentId } from '@/lib/content/get-content-items'
import { findDuplicateIds } from '@/lib/content/find-duplicates'

interface WorkspaceHomePageProps {
  params: { id: string }
  searchParams: { page?: string }
}

const PAGE_SIZE = 50

export default async function WorkspaceHomePage({ params, searchParams }: WorkspaceHomePageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  // Parallelize the workspace-list lookup and the content-items fetch.
  // getWorkspaces is cached via React.cache so downstream callers in
  // the layout share the same result. The items fetch doesn't depend
  // on membership — RLS hides rows for non-members anyway. AI keys come
  // along to gate the Smart-Import-Box's OpenAI warning.
  const [workspaces, items, aiKeys, latestContentId] = await Promise.all([
    getWorkspaces(),
    getContentItems(params.id, { limit: PAGE_SIZE, offset }),
    getAiKeys(params.id),
    getLatestContentId(params.id),
  ])

  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()
  const canCreate = workspace.role === 'owner' || workspace.role === 'editor'
  const hasOpenAiKey = aiKeys.some((k) => k.provider === 'openai')
  const duplicateIds = findDuplicateIds(items)

  // Quick stats
  const readyCount = items.filter((i) => i.status === 'ready').length
  const processingCount = items.filter(
    (i) => i.status === 'processing' || i.status === 'uploading',
  ).length
  const failedCount = items.filter((i) => i.status === 'failed').length

  // Find first ready item without outputs for a CTA
  const firstReady = items.find((i) => i.status === 'ready')

  const heroBody =
    items.length === 0
      ? 'Every video you import lands here — ready to slice into platform drafts in under a minute.'
      : `${items.length} video${items.length === 1 ? '' : 's'} in this workspace · ${readyCount} ready, ${processingCount} processing.`

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 pt-4 sm:pt-6">
      <CreateStepper
        workspaceId={params.id}
        activeStep={1}
        contentId={latestContentId ?? undefined}
      />

      {/* ── Hero: greeting block matches /dashboard ──────────────────── */}
      <section className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <p
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{
              color: '#7A7468',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            {workspace.name} · Content
          </p>
          <h1
            className="text-[clamp(38px,5.5vw,64px)] leading-[0.98]"
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              color: '#0F0F0F',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            Your content.
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed" style={{ color: '#3A3A3A' }}>
            {heroBody}
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/workspace/${params.id}/content/new`}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-5 text-[13px] font-semibold transition-transform hover:scale-[1.02]"
            style={{
              background: '#0F0F0F',
              color: '#FFFFFF',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 12px -4px rgba(15,15,15,0.45)',
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Import video
          </Link>
        )}
      </section>

      <RecentImportsStrip workspaceId={params.id} items={items} />
      {canCreate ? (
        <SmartImportBox
          workspaceId={params.id}
          hasOpenAiKey={hasOpenAiKey}
          mode="inline"
        />
      ) : null}

      {/* ── Status stats strip ── compact pills, only when content exists */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          <StatChip
            tone="ready"
            value={readyCount}
            label="Ready"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StatChip
            tone="processing"
            value={processingCount}
            label="Processing"
            icon={
              <Loader2
                className={`h-4 w-4 ${processingCount > 0 ? 'animate-spin' : ''}`}
              />
            }
          />
          <StatChip
            tone="failed"
            value={failedCount}
            label="Failed"
            icon={<AlertCircle className="h-4 w-4" />}
          />
        </div>
      )}

      {/* ── Content shortcuts — show when user has ready content ── */}
      {readyCount > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {firstReady && (
            <Link
              href={`/workspace/${params.id}/content/${firstReady.id}/highlights`}
              className="group flex items-center gap-3 rounded-[20px] p-3.5 transition-all duration-200 hover:scale-[1.012] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.7)] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.7),0_12px_32px_rgba(15,15,15,0.06)]"
              style={{ background: '#F9F4DC', border: '1px solid rgba(15,15,15,0.06)' }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: '#F4D93D', color: '#0F0F0F' }}
              >
                <Wand2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold" style={{ color: '#0F0F0F' }}>
                  Find viral moments
                </p>
                <p className="truncate text-[10px]" style={{ color: '#3A3A3A' }}>
                  {firstReady.title ?? 'Untitled'}
                </p>
              </div>
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                style={{ color: '#7A7468' }}
              />
            </Link>
          )}
          <Link
            href={`/workspace/${params.id}/pipeline`}
            className="group flex items-center gap-3 rounded-[20px] p-3.5 transition-all duration-200 hover:scale-[1.012] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.7)] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.7),0_12px_32px_rgba(15,15,15,0.06)]"
            style={{ background: '#F9F4DC', border: '1px solid rgba(15,15,15,0.06)' }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: '#0F0F0F', color: '#FFFFFF' }}
            >
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold" style={{ color: '#0F0F0F' }}>
                Review pipeline
              </p>
              <p className="text-[10px]" style={{ color: '#3A3A3A' }}>
                Approve &amp; publish
              </p>
            </div>
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ color: '#7A7468' }}
            />
          </Link>
        </div>
      )}

      {/* ── Content list ── */}
      <ContentListWithSearch
        items={items}
        workspaceId={params.id}
        duplicateIds={duplicateIds}
      />

      {/* ── Pagination ── */}
      {(items.length === PAGE_SIZE || page > 1) && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={`/workspace/${params.id}?page=${page - 1}`}
              className="rounded-full px-4 py-2 text-xs font-semibold transition-colors hover:bg-[rgba(15,15,15,0.04)]"
              style={{ border: '1px solid rgba(15,15,15,0.14)', color: '#0F0F0F' }}
            >
              ← Previous
            </Link>
          )}
          <span
            className="text-xs tabular-nums"
            style={{
              color: '#7A7468',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            Page {page}
          </span>
          {items.length === PAGE_SIZE && (
            <Link
              href={`/workspace/${params.id}?page=${page + 1}`}
              className="rounded-full px-4 py-2 text-xs font-semibold transition-colors hover:bg-[rgba(15,15,15,0.04)]"
              style={{ border: '1px solid rgba(15,15,15,0.14)', color: '#0F0F0F' }}
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function StatChip({
  tone,
  value,
  label,
  icon,
}: {
  tone: 'ready' | 'processing' | 'failed'
  value: number
  label: string
  icon: React.ReactNode
}) {
  // Crextio palette: charcoal numbers on cream cards, yellow accent for
  // the "ready" tone (your good state), neutral for processing, dark
  // outline-only for failed (still readable, not screaming red).
  const accent = {
    ready: { iconBg: '#F4D93D', iconColor: '#0F0F0F' },
    processing: { iconBg: 'rgba(15,15,15,0.08)', iconColor: '#0F0F0F' },
    failed: { iconBg: '#0F0F0F', iconColor: '#F4D93D' },
  }[tone]
  return (
    <div
      className="flex items-center gap-3 rounded-[20px] px-4 py-3 transition-all duration-200 hover:scale-[1.012] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.7)] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.7),0_12px_32px_rgba(15,15,15,0.06)]"
      style={{
        background: '#F9F4DC',
        border: '1px solid rgba(15,15,15,0.06)',
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: accent.iconBg, color: accent.iconColor }}
      >
        {icon}
      </span>
      <div>
        <p
          className="text-[22px] tabular-nums leading-none"
          style={{
            fontFamily: 'var(--font-inter-tight), sans-serif',
            color: '#0F0F0F',
            fontWeight: 400,
            letterSpacing: '-0.025em',
          }}
        >
          {value}
        </p>
        <p
          className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: '#3A3A3A' }}
        >
          {label}
        </p>
      </div>
    </div>
  )
}
