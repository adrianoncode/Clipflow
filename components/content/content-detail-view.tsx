'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Clapperboard,
  Layers,
  MessageSquare,
  Move,
  Sparkles,
  Globe,
  Scissors,
  Play,
  Wand2,
  BarChart3,
  Tag,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form-message'
import { ContentStatusBadge } from '@/components/content/content-status-badge'
import { FollowUpTopicsDialog } from '@/components/content/follow-up-topics-dialog'
import { RetryTranscriptionButton } from '@/components/content/retry-transcription-button'
import { TranscriptView } from '@/components/content/transcript-view'
import { VideoPlayer } from '@/components/content/video-player'
import { AssignToProjectSelector } from '@/components/projects/assign-to-project-selector'
import { AutoTagButton } from '@/components/content/auto-tag-button'
import { SentimentAnalysisButton } from '@/components/content/sentiment-analysis-button'
import { ShowNotesPanel } from '@/components/content/show-notes-panel'
import { NewsletterPanel } from '@/components/content/newsletter-panel'
import { ClipFinder } from '@/components/content/clip-finder'
import type { SentimentResult, BestClip } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import { AutoGenerateTrigger } from '@/components/content/auto-generate-trigger'
import { DeleteContentButton } from '@/components/content/delete-content-button'
import { EditorExportPanel } from '@/components/content/editor-export-panel'
import { RenameContentForm } from '@/components/content/rename-content-form'
import type { ContentItemRow } from '@/lib/content/get-content-item'
import type { ProjectRow } from '@/lib/projects/get-projects'

interface ContentDetailViewProps {
  item: ContentItemRow
  workspaceId: string
  hasExistingOutputs: boolean
  outputCount?: number
  projects?: Pick<ProjectRow, 'id' | 'name'>[]
  signedUrl?: string
}

type Tab = 'overview' | 'generate' | 'tools'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function readErrorMessage(metadata: ContentItemRow['metadata']): string {
  if (
    metadata &&
    typeof metadata === 'object' &&
    !Array.isArray(metadata) &&
    'error' in metadata &&
    metadata.error &&
    typeof metadata.error === 'object' &&
    !Array.isArray(metadata.error) &&
    'message' in metadata.error &&
    typeof metadata.error.message === 'string'
  ) {
    return metadata.error.message
  }
  return 'Transcription failed for an unknown reason.'
}

interface ToolCardProps {
  icon: React.ReactNode
  label: string
  description: string
  href: string
}

function ToolCard({ icon, label, description, href }: ToolCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card p-4 transition-all card-hover hover:text-foreground text-muted-foreground"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          {icon}
        </span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </Link>
  )
}

/* ── Tab pill nav (matches workspace-tab-nav style) ── */
const TABS: { key: Tab; label: string; badge?: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'generate', label: 'Generate' },
  { key: 'tools', label: 'AI Tools', badge: '8' },
]

function TabNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="flex items-center gap-1">
      {TABS.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
            }`}
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary"
              />
            )}
            {t.label}
            {t.badge && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground/60'
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

/* ── Collapsible transcript (first 500 chars preview) ── */
function CollapsibleTranscript({
  text,
  workspaceId,
  contentId,
}: {
  text: string
  workspaceId: string
  contentId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const needsCollapse = text.length > 500

  if (!needsCollapse || expanded) {
    return (
      <div className="space-y-2">
        <TranscriptView text={text} workspaceId={workspaceId} contentId={contentId} />
        {needsCollapse && expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Collapse transcript
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Transcript
      </h2>
      <div className="relative rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
        <p className="whitespace-pre-wrap break-words">{text.slice(0, 500)}...</p>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-muted/30 to-transparent rounded-b-md" />
      </div>
      <button
        onClick={() => setExpanded(true)}
        className="text-xs font-medium text-primary hover:underline"
      >
        Show full transcript
      </button>
    </div>
  )
}

export function ContentDetailView({
  item,
  workspaceId,
  hasExistingOutputs,
  outputCount = 0,
  projects = [],
  signedUrl,
}: ContentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const title = item.title ?? 'Untitled'
  const isReady = item.status === 'ready'
  const hasTranscript = isReady && !!item.transcript

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = item.metadata as any
  const currentTags =
    meta && typeof meta === 'object' && !Array.isArray(meta) && Array.isArray(meta.tags)
      ? (meta.tags as string[])
      : []
  const initialSentiment: SentimentResult | null =
    meta && typeof meta === 'object' && !Array.isArray(meta) && 'sentiment' in meta
      ? meta.sentiment
      : null
  const initialShowNotes = meta?.show_notes ?? null
  const initialNewsletter = meta?.newsletter ?? null
  const initialClips: BestClip[] | null = meta?.best_clips ?? null

  const wordCount = item.transcript ? item.transcript.split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      {/* ── Header (always visible) ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link
            href={`/workspace/${workspaceId}`}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to workspace
          </Link>
          <RenameContentForm
            workspaceId={workspaceId}
            contentId={item.id}
            currentTitle={title}
          />
          <p className="text-xs text-muted-foreground">
            {item.kind === 'video' ? 'Video / audio'
              : item.kind === 'youtube' ? 'YouTube'
              : item.kind === 'url' ? 'Website'
              : 'Text'} · added {formatDate(item.created_at)}
          </p>
          {projects.length > 0 && (
            <AssignToProjectSelector
              workspaceId={workspaceId}
              contentId={item.id}
              currentProjectId={item.project_id}
              projects={projects}
            />
          )}
        </div>
        <ContentStatusBadge status={item.status} />
      </div>

      {/* ── Video player (always visible) ── */}
      {signedUrl ? (
        <VideoPlayer signedUrl={signedUrl} title={item.title ?? undefined} />
      ) : null}

      {/* ── Status banners for non-ready states (always visible) ── */}
      {item.status === 'uploading' || item.status === 'processing' ? (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>
              {item.status === 'uploading' ? 'Waiting for upload to finish' : 'Transcribing...'}
            </CardTitle>
            <CardDescription>
              {item.status === 'uploading'
                ? 'This page will refresh automatically.'
                : 'Whisper is turning your audio into text. This can take a minute or two.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Auto-refreshing every 3 seconds...
          </CardContent>
        </Card>
      ) : null}

      {item.status === 'failed' ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Transcription failed</CardTitle>
            <CardDescription>Fix the issue and try again.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormMessage variant="error">{readErrorMessage(item.metadata)}</FormMessage>
            {item.kind === 'video' && item.source_url ? (
              <RetryTranscriptionButton workspaceId={workspaceId} contentId={item.id} />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {item.status === 'ready' && !item.transcript ? (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>No transcript stored</CardTitle>
            <CardDescription>
              This content is marked ready but has no transcript text -- likely an older row.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* ── Auto-generate trigger (fires once when content becomes ready) ── */}
      <AutoGenerateTrigger
        workspaceId={workspaceId}
        contentId={item.id}
        isReady={isReady}
        hasOutputs={hasExistingOutputs}
      />

      {/* ── Tab nav (only show when transcript is ready) ── */}
      {hasTranscript && (
        <>
          <TabNav active={activeTab} onChange={setActiveTab} />

          {/* ─── Tab 1: Overview ─── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* What's Next: Generate outputs CTA */}
              {isReady && !hasExistingOutputs && (
                <Link
                  href={`/workspace/${workspaceId}/content/${item.id}/outputs`}
                  className="group flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-background to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/10">
                    <Wand2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Ready! Generate outputs for 4 platforms</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Create TikTok, Reels, Shorts &amp; LinkedIn drafts in one pass.
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all group-hover:shadow-md">
                    Generate
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )}

              {/* What's Next: Pipeline link */}
              {isReady && hasExistingOutputs && outputCount > 0 && (
                <Link
                  href={`/workspace/${workspaceId}/pipeline`}
                  className="group flex items-center gap-4 rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/50 to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      You have {outputCount} draft{outputCount !== 1 ? 's' : ''} ready
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Review them, approve the best ones, and schedule them.
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700 transition-transform group-hover:translate-x-0.5">
                    Review drafts
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              )}

              {/* Collapsible Transcript */}
              <CollapsibleTranscript
                text={item.transcript!}
                workspaceId={workspaceId}
                contentId={item.id}
              />

              {/* Basic metadata */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border/50 bg-card p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {item.kind === 'video' ? 'Video / Audio'
                      : item.kind === 'youtube' ? 'YouTube'
                      : item.kind === 'url' ? 'Website'
                      : 'Text'}
                  </p>
                </div>
                {meta?.duration_seconds ? (
                  <div className="rounded-xl border border-border/50 bg-card p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Duration</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {Math.floor(meta.duration_seconds / 60)}m {Math.round(meta.duration_seconds % 60)}s
                    </p>
                  </div>
                ) : null}
                <div className="rounded-xl border border-border/50 bg-card p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Words</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {wordCount.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Created</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Output count badge */}
              {hasExistingOutputs && outputCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Layers className="h-3 w-3" />
                    {outputCount} output{outputCount !== 1 ? 's' : ''} generated
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ─── Tab 2: Generate ─── */}
          {activeTab === 'generate' && (
            <div className="space-y-6">
              {/* Primary CTA */}
              <Link
                href={`/workspace/${workspaceId}/content/${item.id}/outputs`}
                className="group flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-background to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/10">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">
                    {hasExistingOutputs ? 'View & regenerate outputs' : 'Generate outputs for 4 platforms'}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {hasExistingOutputs
                      ? 'Review your existing drafts or regenerate new ones.'
                      : 'Create TikTok, Reels, Shorts & LinkedIn drafts in one pass.'}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all group-hover:shadow-md">
                  {hasExistingOutputs ? 'View' : 'Generate'}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              {/* Output summary */}
              {hasExistingOutputs && outputCount > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Output Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <Layers className="h-3 w-3" />
                        {outputCount} output{outputCount !== 1 ? 's' : ''}
                      </span>
                      <Link
                        href={`/workspace/${workspaceId}/pipeline`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Review drafts →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show Notes */}
              <ShowNotesPanel
                workspaceId={workspaceId}
                contentId={item.id}
                initialShowNotes={initialShowNotes}
              />

              {/* Newsletter */}
              <NewsletterPanel
                workspaceId={workspaceId}
                contentId={item.id}
                initialNewsletter={initialNewsletter}
              />

              {/* Follow-up Topics */}
              <FollowUpTopicsDialog workspaceId={workspaceId} contentId={item.id} />

              {/* Editor Export */}
              <EditorExportPanel
                contentId={item.id}
                contentTitle={title}
                transcript={item.transcript ?? ''}
                srt={(meta?.srt as string) ?? null}
                vtt={(meta?.vtt as string) ?? null}
                clips={(meta?.best_clips as Array<{
                  quote: string
                  reason: string
                  position_pct: number
                  type: string
                  estimated_duration: string
                }>) ?? null}
                estimatedDurationSec={(meta?.duration_seconds as number) ?? null}
              />
            </div>
          )}

          {/* ─── Tab 3: AI Tools ─── */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              {/* Studio shortcut (top) */}
              {(item.kind === 'video' || item.kind === 'youtube') && (
                <Link
                  href={`/workspace/${workspaceId}/studio?content_id=${item.id}`}
                  className="group flex w-full items-center justify-between rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/[0.06] to-background px-5 py-4 transition-all hover:border-primary/50 hover:bg-primary/[0.08] hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <Play className="h-4 w-4 fill-current text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Render in Video Studio</p>
                      <p className="text-xs text-muted-foreground">
                        AI captions + reframe → ready-to-post MP4 in ~60 s
                      </p>
                    </div>
                  </div>
                  <Clapperboard className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary/60" />
                </Link>
              )}

              {/* Video tools section */}
              <div className="space-y-3">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Video Tools
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ToolCard
                    icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
                    label="Subtitles"
                    description="Burn stylized captions into your video for social platforms."
                    href={`/workspace/${workspaceId}/content/${item.id}/subtitles`}
                  />
                  <ToolCard
                    icon={<Clapperboard className="h-4 w-4 text-muted-foreground" />}
                    label="B-Roll"
                    description="Auto-generate contextual B-Roll clips with AI."
                    href={`/workspace/${workspaceId}/content/${item.id}/broll`}
                  />
                  <ToolCard
                    icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
                    label="AI Avatar"
                    description="Generate a talking-head avatar from your transcript."
                    href={`/workspace/${workspaceId}/content/${item.id}/avatar`}
                  />
                  {item.kind === 'video' ? (
                    <ToolCard
                      icon={<Move className="h-4 w-4 text-muted-foreground" />}
                      label="Reframe"
                      description="Smart-crop horizontal video to vertical 9:16 format."
                      href={`/workspace/${workspaceId}/content/${item.id}/reframe`}
                    />
                  ) : null}
                  {item.kind === 'video' ? (
                    <ToolCard
                      icon={<Globe className="h-4 w-4 text-muted-foreground" />}
                      label="Auto-Dub"
                      description="Translate and dub your video into other languages."
                      href={`/workspace/${workspaceId}/content/${item.id}/dub`}
                    />
                  ) : null}
                </div>
              </div>

              {/* Analysis tools section */}
              <div className="space-y-3">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Analysis
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-card p-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Scissors className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <span className="text-sm font-semibold text-foreground">Clip Finder</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground mb-3">
                      AI finds the most engaging clips from your content.
                    </p>
                    <ClipFinder
                      workspaceId={workspaceId}
                      contentId={item.id}
                      initialClips={initialClips}
                    />
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card p-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <span className="text-sm font-semibold text-foreground">Auto-Tag</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground mb-3">
                      Automatically tag content with relevant topics and categories.
                    </p>
                    <AutoTagButton
                      workspaceId={workspaceId}
                      contentId={item.id}
                      currentTags={currentTags}
                    />
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card p-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <span className="text-sm font-semibold text-foreground">Sentiment</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground mb-3">
                      Analyze the emotional tone and sentiment of your content.
                    </p>
                    <SentimentAnalysisButton
                      workspaceId={workspaceId}
                      contentId={item.id}
                      initialSentiment={initialSentiment}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Delete (always visible) ── */}
      <div className="border-t border-border/50 pt-4">
        <DeleteContentButton workspaceId={workspaceId} contentId={item.id} />
      </div>
    </div>
  )
}
