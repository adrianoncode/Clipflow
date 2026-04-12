'use client'

import { useState } from 'react'
import { Flame, Target, BarChart2, Star, CalendarDays } from 'lucide-react'

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
import { HookAbTest } from '@/components/outputs/hook-ab-test'
import { EngagementPredictor } from '@/components/outputs/engagement-predictor'
import { SchedulePostButton } from '@/components/scheduler/schedule-post-button'
import type { OutputRow } from '@/lib/content/get-outputs'
import type { OutputPlatform } from '@/lib/supabase/types'
import type { AbHookVariant, EngagementPrediction } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'

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

type SectionKey = 'virality' | 'hooks' | 'predict' | 'track' | 'schedule'

interface SectionToggleProps {
  icon: React.ReactNode
  label: string
  sectionKey: SectionKey
  active: boolean
  onClick: () => void
}

function SectionToggle({ icon, label, sectionKey, active, onClick }: SectionToggleProps) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      {icon}
    </button>
  )
}

interface OutputCardProps {
  output: OutputRow
  contentId: string
  workspaceId?: string
}

export function OutputCard({ output, contentId, workspaceId }: OutputCardProps) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null)
  const toggle = (s: SectionKey) => setOpenSection((prev) => (prev === s ? null : s))

  const resolvedWorkspaceId = workspaceId ?? output.workspace_id

  return (
    <Card className="flex h-full flex-col border-border/50">
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
        <div className="whitespace-pre-wrap break-words rounded-xl border border-border/50 bg-muted/30 p-3 text-sm leading-relaxed">
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

        {/* Accordion toggles */}
        {resolvedWorkspaceId && (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-1 border-t border-border/50 pt-3">
              <SectionToggle
                icon={<Flame className="h-4 w-4" />}
                label="Virality"
                sectionKey="virality"
                active={openSection === 'virality'}
                onClick={() => toggle('virality')}
              />
              <SectionToggle
                icon={<Target className="h-4 w-4" />}
                label="Hooks"
                sectionKey="hooks"
                active={openSection === 'hooks'}
                onClick={() => toggle('hooks')}
              />
              <SectionToggle
                icon={<BarChart2 className="h-4 w-4" />}
                label="Predict"
                sectionKey="predict"
                active={openSection === 'predict'}
                onClick={() => toggle('predict')}
              />
              <SectionToggle
                icon={<Star className="h-4 w-4" />}
                label="Track"
                sectionKey="track"
                active={openSection === 'track'}
                onClick={() => toggle('track')}
              />
              <SectionToggle
                icon={<CalendarDays className="h-4 w-4" />}
                label="Schedule"
                sectionKey="schedule"
                active={openSection === 'schedule'}
                onClick={() => toggle('schedule')}
              />
            </div>

            {/* Accordion content */}
            <div className={`overflow-hidden transition-all duration-200 ${openSection ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {openSection === 'virality' && (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <ViralityScore
                    outputId={output.id}
                    workspaceId={resolvedWorkspaceId}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    initialVirality={((output.metadata as any)?.virality) ?? null}
                  />
                </div>
              )}
              {openSection === 'hooks' && (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <HookAbTest
                    outputId={output.id}
                    workspaceId={resolvedWorkspaceId}
                    initialVariants={
                      ((output.metadata as Record<string, unknown> | null)?.hook_variants as AbHookVariant[] | null) ?? null
                    }
                  />
                </div>
              )}
              {openSection === 'predict' && (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <EngagementPredictor
                    outputId={output.id}
                    workspaceId={resolvedWorkspaceId}
                    initialPrediction={
                      ((output.metadata as Record<string, unknown> | null)?.engagement_prediction as EngagementPrediction | null) ?? null
                    }
                  />
                </div>
              )}
              {openSection === 'track' && (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <PerformanceTracker
                    outputId={output.id}
                    workspaceId={resolvedWorkspaceId}
                    initialPerformance={
                      ((output.metadata as Record<string, unknown> | null)?.performance as {
                        rating: number
                        note: string
                        recorded_at: string
                      } | null) ?? null
                    }
                  />
                </div>
              )}
              {openSection === 'schedule' && (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <SchedulePostButton
                    outputId={output.id}
                    workspaceId={resolvedWorkspaceId}
                    platform={SCHEDULER_PLATFORM[output.platform]}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
