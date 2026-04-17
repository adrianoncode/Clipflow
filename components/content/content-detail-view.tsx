'use client'

import { useState } from 'react'
import Link from 'next/link'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form-message'
import { ContentStatusBadge } from '@/components/content/content-status-badge'
import { RetryTranscriptionButton } from '@/components/content/retry-transcription-button'
import { VideoPlayer } from '@/components/content/video-player'
import { AssignToProjectSelector } from '@/components/projects/assign-to-project-selector'
import { AutoGenerateTrigger } from '@/components/content/auto-generate-trigger'
import { DeleteContentButton } from '@/components/content/delete-content-button'
import { RenameContentForm } from '@/components/content/rename-content-form'
import type { ContentItemRow } from '@/lib/content/get-content-item'
import type { ProjectRow } from '@/lib/projects/get-projects'

import {
  TabNav,
  type ContentDetailTab,
  formatDate,
  readErrorMessage,
} from './content-detail/shared'
import { OverviewTab } from './content-detail/overview-tab'
import { GenerateTab } from './content-detail/generate-tab'
import { ToolsTab } from './content-detail/tools-tab'

interface ContentDetailViewProps {
  item: ContentItemRow
  workspaceId: string
  hasExistingOutputs: boolean
  outputCount?: number
  projects?: Pick<ProjectRow, 'id' | 'name'>[]
  signedUrl?: string
}

/**
 * Orchestrates the content-detail page. Renders the persistent header
 * (title, status, video player, status banners) and delegates tab
 * bodies to `./content-detail/{overview,generate,tools}-tab.tsx`.
 *
 * Split from a 644-line god-component in the refactor commit that
 * extracted the 3 tabs + shared helpers (TabNav, CollapsibleTranscript,
 * ToolCard) into `./content-detail/`.
 */
export function ContentDetailView({
  item,
  workspaceId,
  hasExistingOutputs,
  outputCount = 0,
  projects = [],
  signedUrl,
}: ContentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<ContentDetailTab>('overview')
  const title = item.title ?? 'Untitled'
  const isReady = item.status === 'ready'
  const hasTranscript = isReady && !!item.transcript

  const meta =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : null

  const wordCount = item.transcript
    ? item.transcript.split(/\s+/).filter(Boolean).length
    : 0

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      {/* ── Header ── */}
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
            {item.kind === 'video'
              ? 'Video / audio'
              : item.kind === 'youtube'
                ? 'YouTube'
                : item.kind === 'url'
                  ? 'Website'
                  : 'Text'}{' '}
            · added {formatDate(item.created_at)}
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

      {/* ── Video player ── */}
      {signedUrl && (
        <VideoPlayer signedUrl={signedUrl} title={item.title ?? undefined} />
      )}

      {/* ── Status banners ── */}
      {(item.status === 'uploading' || item.status === 'processing') && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>
              {item.status === 'uploading'
                ? 'Waiting for upload to finish'
                : 'Transcribing...'}
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
      )}

      {item.status === 'failed' && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Transcription failed</CardTitle>
            <CardDescription>Fix the issue and try again.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormMessage variant="error">{readErrorMessage(item.metadata)}</FormMessage>
            {item.kind === 'video' && item.source_url && (
              <RetryTranscriptionButton workspaceId={workspaceId} contentId={item.id} />
            )}
          </CardContent>
        </Card>
      )}

      {item.status === 'ready' && !item.transcript && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>No transcript stored</CardTitle>
            <CardDescription>
              This content is marked ready but has no transcript text -- likely an older row.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* ── Auto-generate trigger ── */}
      <AutoGenerateTrigger
        workspaceId={workspaceId}
        contentId={item.id}
        isReady={isReady}
        hasOutputs={hasExistingOutputs}
      />

      {/* ── Tabbed content ── */}
      {hasTranscript && (
        <>
          <TabNav active={activeTab} onChange={setActiveTab} />

          {activeTab === 'overview' && (
            <OverviewTab
              item={item}
              workspaceId={workspaceId}
              hasExistingOutputs={hasExistingOutputs}
              outputCount={outputCount}
              meta={meta}
              wordCount={wordCount}
              isReady={isReady}
            />
          )}

          {activeTab === 'generate' && (
            <GenerateTab
              item={item}
              workspaceId={workspaceId}
              hasExistingOutputs={hasExistingOutputs}
              outputCount={outputCount}
              meta={meta}
            />
          )}

          {activeTab === 'tools' && (
            <ToolsTab item={item} workspaceId={workspaceId} meta={meta} />
          )}
        </>
      )}

      {/* ── Delete ── */}
      <div className="border-t border-border/50 pt-4">
        <DeleteContentButton workspaceId={workspaceId} contentId={item.id} />
      </div>
    </div>
  )
}
