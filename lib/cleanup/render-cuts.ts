import 'server-only'

import {
  submitRender,
  type ShotstackClip,
} from '@/lib/video/shotstack-render'
import type { KeepRange } from '@/lib/cleanup/detect-fillers'

/**
 * Render a cleaned-up version of a video by splicing the user's
 * "kept" time ranges back into a single timeline.
 *
 * Shotstack accepts an array of clips with their own trim windows
 * (`asset.trim`) and timeline placements (`start`, `length`). We
 * append clips back-to-back so the output stitches every kept range
 * into one continuous video, with the filler-word ranges quietly
 * skipped.
 *
 * The function is intentionally minimal — no captions, no brand kit,
 * no hook overlay. Cleanup is a "shorter, tighter version of your
 * source"; users layer the rest of the studio on top of the result
 * by importing the cleaned MP4 as a new content item.
 */
export interface SubmitCutTimelineParams {
  workspaceId: string
  sourceVideoUrl: string
  keepRanges: KeepRange[]
  aspectRatio?: '16:9' | '9:16' | '1:1' | '2:3'
}

export async function submitCutTimelineRender(
  params: SubmitCutTimelineParams,
): Promise<{ ok: true; renderId: string } | { ok: false; error: string }> {
  if (params.keepRanges.length === 0) {
    return { ok: false, error: 'No ranges to render.' }
  }

  // Build clip list. Each clip references the same source URL but
  // trims to the kept range. We place them sequentially on the
  // timeline so they read as one continuous edited video.
  let timelineCursor = 0
  const clips: ShotstackClip[] = params.keepRanges.map((range) => {
    const length = Math.max(range.end - range.start, 0.05)
    const clip: ShotstackClip = {
      type: 'video',
      src: params.sourceVideoUrl,
      start: timelineCursor,
      length,
      fit: 'cover',
      // Shotstack reads `trim` from the input source — start of the
      // kept window. The clip's `length` then determines how long
      // that trimmed section plays on the output timeline.
      trim: range.start,
    }
    timelineCursor += length
    return clip
  })

  return submitRender({
    workspaceId: params.workspaceId,
    clips,
    aspectRatio: params.aspectRatio ?? '9:16',
  })
}
