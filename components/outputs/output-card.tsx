import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { OutputStateBadge } from '@/components/outputs/output-state-badge'
import { OutputActions } from '@/components/outputs/output-actions'
import { PerformanceTracker } from '@/components/outputs/performance-tracker'
import { StateTransitionPills } from '@/components/outputs/state-transition-pills'
import { ViralityScore } from '@/components/outputs/virality-score'
import { SchedulePostButton } from '@/components/scheduler/schedule-post-button'
import type { OutputRow } from '@/lib/content/get-outputs'
import type { OutputPlatform } from '@/lib/supabase/types'

const PLATFORM_LABELS: Record<OutputPlatform, string> = {
  tiktok: 'TikTok',
  instagram_reels: 'Instagram Reels',
  youtube_shorts: 'YouTube Shorts',
  linkedin: 'LinkedIn',
}

// Maps OutputPlatform to the platform key used by the social scheduler
const SCHEDULER_PLATFORM: Record<OutputPlatform, string> = {
  tiktok: 'tiktok',
  instagram_reels: 'instagram',
  youtube_shorts: 'youtube_shorts',
  linkedin: 'linkedin',
}

const PLATFORM_DESCRIPTIONS: Record<OutputPlatform, string> = {
  tiktok: 'Vertical short-form, 15-60s, hook-heavy',
  instagram_reels: 'Aesthetic short-form, caption-driven',
  youtube_shorts: 'Up to 60s, educational tone OK',
  linkedin: 'Text-first post, professional but human',
}

interface OutputCardProps {
  output: OutputRow
  contentId: string
  workspaceId?: string
}

export function OutputCard({ output, contentId, workspaceId }: OutputCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{PLATFORM_LABELS[output.platform]}</CardTitle>
            <CardDescription className="text-xs">
              {PLATFORM_DESCRIPTIONS[output.platform]}
            </CardDescription>
          </div>
          <OutputStateBadge state={output.latest_state} />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
          {output.body ?? '(empty)'}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3">
        <OutputActions output={output} contentId={contentId} />
        <StateTransitionPills
          outputId={output.id}
          workspaceId={output.workspace_id}
          currentState={output.latest_state}
        />
        {(workspaceId ?? output.workspace_id) && (
          <ViralityScore
            outputId={output.id}
            workspaceId={workspaceId ?? output.workspace_id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialVirality={((output.metadata as any)?.virality) ?? null}
          />
        )}
        {(workspaceId ?? output.workspace_id) && (
          <PerformanceTracker
            outputId={output.id}
            workspaceId={workspaceId ?? output.workspace_id}
            initialPerformance={
              ((output.metadata as Record<string, unknown> | null)?.performance as {
                rating: number
                note: string
                recorded_at: string
              } | null) ?? null
            }
          />
        )}
        {(workspaceId ?? output.workspace_id) && (
          <SchedulePostButton
            outputId={output.id}
            workspaceId={workspaceId ?? output.workspace_id}
            platform={SCHEDULER_PLATFORM[output.platform]}
          />
        )}
      </CardFooter>
    </Card>
  )
}
