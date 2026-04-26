'use client'

import {
  AnalyticsDemo,
  BrandKitDemo,
  ClipFinderDemo,
  HookTestDemo,
  ReviewLinkDemo,
  ScheduleDemo,
} from '@/components/landing/bento-showcase'
import { ThumbnailVisual } from './thumbnail-visual'
import { BrandVoiceVisual } from './brand-voice-visual'
import { ViralMomentsVisual } from './viral-moments-visual'
import {
  AutoSubtitlesVisual,
  AutoReframeVisual,
  BRollVisual,
  AIAvatarVisual,
  AutoDubVisual,
} from './video-tool-visuals'
import { PipelineFlowDiagram, RssFlowDiagram, AgencyFlowDiagram } from './flow-diagrams'

/**
 * Central mapping of visual-slot ids to demo components. A feature /
 * use-case entry in `lib/landing/features.ts` can reference one of
 * these by string id via the `visual` field (added in the same pass).
 *
 * Each visual is self-contained: respects prefers-reduced-motion,
 * styles itself from the lv2-root CSS variables, and renders at any
 * size without overflow. They're meant to slot under the hero on a
 * detail page or between sections as a breakpoint.
 */
export type VisualId =
  | 'clip-finder'
  | 'brand-kit'
  | 'schedule'
  | 'hook-test'
  | 'review-link'
  | 'analytics'
  | 'thumbnail'
  | 'brand-voice'
  | 'pipeline-flow'
  | 'rss-flow'
  | 'agency-flow'
  | 'viral-moments'
  | 'auto-subtitles'
  | 'auto-reframe'
  | 'b-roll'
  | 'ai-avatar'
  | 'auto-dub'

export function FeatureVisual({ id }: { id: VisualId }) {
  const Cmp = VISUAL_MAP[id]
  if (!Cmp) return null

  return (
    <div
      className="overflow-hidden rounded-[20px] p-6"
      style={{
        background: 'var(--lv2-card)',
        border: '1px solid var(--lv2-border)',
        boxShadow: '0 1px 0 rgba(24,21,17,.04)',
      }}
    >
      <Cmp />
    </div>
  )
}

const VISUAL_MAP: Record<VisualId, React.ComponentType> = {
  'clip-finder': ClipFinderDemo,
  'brand-kit': BrandKitDemo,
  schedule: ScheduleDemo,
  'hook-test': HookTestDemo,
  'review-link': ReviewLinkDemo,
  analytics: AnalyticsDemo,
  thumbnail: ThumbnailVisual,
  'brand-voice': BrandVoiceVisual,
  'pipeline-flow': PipelineFlowDiagram,
  'rss-flow': RssFlowDiagram,
  'agency-flow': AgencyFlowDiagram,
  'viral-moments': ViralMomentsVisual,
  'auto-subtitles': AutoSubtitlesVisual,
  'auto-reframe': AutoReframeVisual,
  'b-roll': BRollVisual,
  'ai-avatar': AIAvatarVisual,
  'auto-dub': AutoDubVisual,
}
