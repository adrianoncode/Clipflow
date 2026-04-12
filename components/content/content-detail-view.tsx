import Link from 'next/link'

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
import type { SentimentResult } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
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
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
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
        <Card>
          <CardHeader>
            <CardTitle>
              {item.status === 'uploading' ? 'Waiting for upload to finish' : 'Transcribing…'}
            </CardTitle>
            <CardDescription>
              {item.status === 'uploading'
                ? 'This page will refresh automatically.'
                : 'Whisper is turning your audio into text. This can take a minute or two.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Auto-refreshing every 3 seconds…
          </CardContent>
        </Card>
      ) : null}

      {item.status === 'failed' ? (
        <Card>
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
        <div className="space-y-4">
          <TranscriptView
            text={item.transcript}
            workspaceId={workspaceId}
            contentId={item.id}
          />
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/workspace/${workspaceId}/content/${item.id}/outputs`}>
                {hasExistingOutputs ? 'View outputs' : 'Generate outputs'}
              </Link>
            </Button>
            {hasExistingOutputs ? (
              <span className="text-xs text-muted-foreground">
                Drafts already generated — click to review or regenerate.
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Produces TikTok, Reels, Shorts, and LinkedIn drafts in one pass.
              </span>
            )}
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
        </div>
      ) : null}

      {item.status === 'ready' && !item.transcript ? (
        <Card>
          <CardHeader>
            <CardTitle>No transcript stored</CardTitle>
            <CardDescription>
              This content is marked ready but has no transcript text — likely an older row.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="border-t pt-4">
        <DeleteContentButton workspaceId={workspaceId} contentId={item.id} />
      </div>
    </div>
  )
}
