import Link from 'next/link'
import {
  Clapperboard,
  MessageSquare,
  Move,
  Sparkles,
  Globe,
  Scissors,
  Play,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { DeleteContentButton } from '@/components/content/delete-content-button'
import { RenameContentForm } from '@/components/content/rename-content-form'
import type { ContentItemRow } from '@/lib/content/get-content-item'
import type { ProjectRow } from '@/lib/projects/get-projects'

interface ContentDetailViewProps {
  item: ContentItemRow
  workspaceId: string
  hasExistingOutputs: boolean
  projects?: Pick<ProjectRow, 'id' | 'name'>[]
  signedUrl?: string
}

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
  href: string
}

function ToolCard({ icon, label, href }: ToolCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card p-3 text-sm font-medium transition-all card-hover hover:text-foreground text-muted-foreground"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
        {icon}
      </span>
      {label}
    </Link>
  )
}

export function ContentDetailView({
  item,
  workspaceId,
  hasExistingOutputs,
  projects = [],
  signedUrl,
}: ContentDetailViewProps) {
  const title = item.title ?? 'Untitled'

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
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

      {signedUrl ? (
        <VideoPlayer
          signedUrl={signedUrl}
          title={item.title ?? undefined}
        />
      ) : null}

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

      {item.status === 'ready' && item.transcript ? (
        <div className="space-y-6">
          <TranscriptView
            text={item.transcript}
            workspaceId={workspaceId}
            contentId={item.id}
          />

          {/* Primary action */}
          <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
            <Link href={`/workspace/${workspaceId}/content/${item.id}/outputs`}>
              {hasExistingOutputs ? 'View outputs' : 'Generate outputs'}
            </Link>
          </Button>

          {hasExistingOutputs ? (
            <p className="text-xs text-muted-foreground">
              Drafts already generated -- click to review or regenerate.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Produces TikTok, Reels, Shorts, and LinkedIn drafts in one pass.
            </p>
          )}

          {/* One-click Studio shortcut for video/youtube items */}
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

          {/* Video Studio — was "AI Tools" but that hid the fact that
              these tools actually produce rendered MP4s, not more text. */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Video Studio
              </h3>
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                Renders MP4s
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <ToolCard
                icon={<Clapperboard className="h-4 w-4 text-muted-foreground" />}
                label="B-Roll"
                href={`/workspace/${workspaceId}/content/${item.id}/broll`}
              />
              <ToolCard
                icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
                label="Subtitles"
                href={`/workspace/${workspaceId}/content/${item.id}/subtitles`}
              />
              {item.kind === 'video' ? (
                <ToolCard
                  icon={<Move className="h-4 w-4 text-muted-foreground" />}
                  label="Reframe"
                  href={`/workspace/${workspaceId}/content/${item.id}/reframe`}
                />
              ) : null}
              <ToolCard
                icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
                label="AI Avatar"
                href={`/workspace/${workspaceId}/content/${item.id}/avatar`}
              />
              {item.kind === 'video' ? (
                <ToolCard
                  icon={<Globe className="h-4 w-4 text-muted-foreground" />}
                  label="Auto-Dub"
                  href={`/workspace/${workspaceId}/content/${item.id}/dub`}
                />
              ) : null}
              <ToolCard
                icon={<Scissors className="h-4 w-4 text-muted-foreground" />}
                label="Clip Finder"
                href={`/workspace/${workspaceId}/content/${item.id}`}
              />
            </div>
          </div>

          <FollowUpTopicsDialog workspaceId={workspaceId} contentId={item.id} />
          <AutoTagButton
            workspaceId={workspaceId}
            contentId={item.id}
            currentTags={
              item.metadata &&
              typeof item.metadata === 'object' &&
              !Array.isArray(item.metadata) &&
              'tags' in item.metadata &&
              Array.isArray((item.metadata as Record<string, unknown>).tags)
                ? ((item.metadata as Record<string, unknown>).tags as string[])
                : []
            }
          />
          <SentimentAnalysisButton
            workspaceId={workspaceId}
            contentId={item.id}
            initialSentiment={
              (item.metadata &&
              typeof item.metadata === 'object' &&
              !Array.isArray(item.metadata) &&
              'sentiment' in item.metadata
                ? (item.metadata as Record<string, unknown>).sentiment
                : null) as SentimentResult | null
            }
          />
          <ShowNotesPanel
            workspaceId={workspaceId}
            contentId={item.id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialShowNotes={((item.metadata as any)?.show_notes) ?? null}
          />
          <NewsletterPanel
            workspaceId={workspaceId}
            contentId={item.id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialNewsletter={((item.metadata as any)?.newsletter) ?? null}
          />
          <ClipFinder
            workspaceId={workspaceId}
            contentId={item.id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialClips={((item.metadata as any)?.best_clips as BestClip[]) ?? null}
          />
        </div>
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

      <div className="border-t border-border/50 pt-4">
        <DeleteContentButton workspaceId={workspaceId} contentId={item.id} />
      </div>
    </div>
  )
}
