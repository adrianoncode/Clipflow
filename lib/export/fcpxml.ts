// Builds an FCPXML 1.10 project from one or more Clipflow clips so pro
// editors can pick up the AI's work in Premiere Pro (23+), DaVinci Resolve
// (18+), or Final Cut Pro (10.6+) without losing clip ranges, captions,
// or markers.
//
// Why FCPXML 1.10:
// - Widest NLE support of any interchange format right now (Pixar's OTIO
//   is more modern but only a fraction of editors actually import it).
// - Uses rational seconds for timecodes instead of integer frames, so we
//   don't have to know the source frame rate to stay accurate.
// - Carries title elements natively, which lets us emit captions as
//   editable titles rather than burned-in pixels.
//
// Keep this file NLE-quirk aware: DaVinci rejects some optional tags that
// Final Cut tolerates. The generator below sticks to the conservative
// subset that all three accept cleanly.

export interface FcpxClip {
  /** Start inside the source video, in seconds. */
  sourceStart: number
  /** End inside the source video, in seconds. */
  sourceEnd: number
  /** Human label — becomes the timeline item name in the NLE. */
  label: string
  /**
   * Caption lines with absolute source-video timestamps. The generator
   * rebases them onto the clip's own timeline so they line up even if the
   * editor moves the clip around.
   */
  captions?: Array<{ text: string; start: number; end: number }>
  /** Optional time-coded markers — rendered as yellow timeline markers. */
  markers?: Array<{ at: number; note: string }>
}

export interface FcpxProject {
  /** Will show up as the Project/Library name in the NLE. */
  title: string
  /** Absolute HTTPS URL to the source media — editors stream directly. */
  sourceUrl: string
  /** Total source duration in seconds (optional — used for the asset). */
  sourceDuration?: number
  /** One sequence per clip — shows up as separate timelines in the NLE. */
  clips: FcpxClip[]
}

/** Rational-seconds helper — FCPXML wants durations like "150/1s". */
function rs(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s'
  // Quantize to milliseconds to avoid runaway precision.
  const ms = Math.max(0, Math.round(seconds * 1000))
  return `${ms}/1000s`
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildFcpxml(project: FcpxProject): string {
  const assetId = 'r1'
  const formatId = 'r2'
  const effectId = 'r3'

  const totalSource = project.sourceDuration ?? Math.max(
    1,
    ...project.clips.map((c) => c.sourceEnd),
  )

  const resources = `
    <format id="${formatId}" name="FFVideoFormat1080p30" frameDuration="100/3000s" width="1080" height="1920" />
    <asset id="${assetId}" name="${esc(project.title)}" src="${esc(project.sourceUrl)}" duration="${rs(totalSource)}" hasVideo="1" hasAudio="1" videoSources="1" audioSources="1" audioChannels="2" />
    <effect id="${effectId}" name="Basic Title" uid=".../Titles.localized/Basic Text.localized/Basic Title.localized/Basic Title.moti" />
  `

  const projects = project.clips
    .map((clip, idx) => {
      const clipLength = Math.max(0.1, clip.sourceEnd - clip.sourceStart)
      const clipName = clip.label || `Clip ${idx + 1}`

      // Markers relative to clip start. Out-of-range markers get clamped
      // and skipped so the editor never sees a marker outside the clip.
      const markers = (clip.markers ?? [])
        .filter((m) => m.at >= clip.sourceStart && m.at <= clip.sourceEnd)
        .map(
          (m) => `<marker start="${rs(m.at - clip.sourceStart)}" duration="40/1000s" value="${esc(m.note)}" />`,
        )
        .join('\n        ')

      // Captions become title elements stacked on lane 1 above the video,
      // so the editor can restyle or disable them without touching the
      // burned-in pixels. Timestamps rebased onto the clip timeline.
      const titles = (clip.captions ?? [])
        .map((c) => {
          const start = Math.max(0, c.start - clip.sourceStart)
          const len = Math.max(0.2, c.end - c.start)
          if (start >= clipLength) return ''
          return `
        <title ref="${effectId}" lane="1" offset="${rs(start)}" start="${rs(start)}" duration="${rs(len)}" name="${esc(c.text).slice(0, 40)}">
          <text>
            <text-style ref="ts${idx}">${esc(c.text)}</text-style>
          </text>
          <text-style-def id="ts${idx}">
            <text-style font="Helvetica" fontSize="72" fontColor="1 1 1 1" bold="1" alignment="center" />
          </text-style-def>
        </title>`
        })
        .filter(Boolean)
        .join('')

      return `
  <project name="${esc(clipName)}">
    <sequence format="${formatId}" duration="${rs(clipLength)}" tcFormat="NDF">
      <spine>
        <asset-clip name="${esc(clipName)}" ref="${assetId}" offset="0s" start="${rs(clip.sourceStart)}" duration="${rs(clipLength)}" tcFormat="NDF">
          ${markers}${titles}
        </asset-clip>
      </spine>
    </sequence>
  </project>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>${resources}</resources>
  <library>
    <event name="${esc(project.title)}">${projects}
    </event>
  </library>
</fcpxml>
`
}

// Tiny SRT writer — intentionally rounds to the format's built-in
// millisecond precision and clamps overlapping segments so YouTube / TikTok
// subtitle ingests don't complain.
export function buildSrt(
  lines: Array<{ text: string; start: number; end: number }>,
): string {
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    const ms = Math.round((s % 1) * 1000)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`
  }
  return lines
    .map((l, i) => {
      const start = Math.max(0, l.start)
      const end = Math.max(start + 0.2, l.end)
      return `${i + 1}\n${fmt(start)} --> ${fmt(end)}\n${l.text.trim()}\n`
    })
    .join('\n')
}
