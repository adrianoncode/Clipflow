interface SparklineProps {
  /** Data points in chronological order (oldest first). */
  data: number[]
  /** Width in px. The SVG scales to this. */
  width?: number
  /** Height in px. */
  height?: number
  /** If true, render as tiny vertical bars instead of a line. */
  variant?: 'line' | 'bars'
  /** Optional override — paint the whole sparkline in this single
   *  colour instead of the brand gradient. Used by the platform-
   *  performance section to encode +/- delta semantics. */
  color?: string
  /** Optional aria label. */
  label?: string
}

/**
 * Zero-dependency sparkline. Inline SVG, server-renderable, no JS.
 *
 * Premium upgrades over the boring polyline version:
 *   - Stroke uses a horizontal linearGradient (plum at low → chartreuse
 *     at high) so the line tells a story, not just a shape
 *   - Catmull-Rom-derived bezier path so the line is smooth, not a
 *     jagged polyline. Chart libraries cost megabytes for this; we
 *     compute it inline in 8 lines
 *   - Endpoint dot has a feGaussianBlur drop-shadow filter so it
 *     glows softly — your eye locks onto "where we are now"
 *   - Area fill is a subtle vertical gradient that fades to nothing,
 *     not a flat tinted polygon
 *   - Bars variant gets per-bar gradient (plum → chartreuse top) +
 *     soft outer glow on the active (last) bar
 *
 * Empty/flat data degrades to a dashed mid-height baseline.
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  variant = 'line',
  color,
  label,
}: SparklineProps) {
  // Each instance gets its own ids so multiple sparklines on a page
  // don't conflict on gradient/filter references.
  const uid = useUid()
  const lineGradId = `cf-sl-line-${uid}`
  const areaGradId = `cf-sl-area-${uid}`
  const barGradId = `cf-sl-bar-${uid}`
  const glowFilterId = `cf-sl-glow-${uid}`

  if (data.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        role={label ? 'img' : 'presentation'}
        aria-label={label}
      >
        <line
          x1={0}
          x2={width}
          y1={height / 2}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeDasharray="2 3"
        />
      </svg>
    )
  }

  const max = Math.max(...data, 1)
  const min = 0
  const range = max - min || 1

  const Defs = (
    <defs>
      {/* Stroke gradient — plum at start, chartreuse at end */}
      <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#2A1A3D" />
        <stop offset="55%" stopColor="#4B0FB8" />
        <stop offset="100%" stopColor="#D6FF3E" />
      </linearGradient>
      {/* Area fill — vertical fade to nothing */}
      <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4B0FB8" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#4B0FB8" stopOpacity="0" />
      </linearGradient>
      {/* Bar gradient — plum at base, chartreuse at top */}
      <linearGradient id={barGradId} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#2A1A3D" />
        <stop offset="100%" stopColor="#D6FF3E" />
      </linearGradient>
      {/* Soft glow filter for endpoint dots / active bar */}
      <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )

  if (variant === 'bars') {
    const barGap = 2
    const barWidth = (width - barGap * (data.length - 1)) / data.length
    const barFill = color ?? `url(#${barGradId})`
    return (
      <svg
        width={width}
        height={height}
        role={label ? 'img' : 'presentation'}
        aria-label={label}
      >
        {Defs}
        {data.map((v, i) => {
          const h = Math.max(1, ((v - min) / range) * height)
          const y = height - h
          const x = i * (barWidth + barGap)
          const active = i === data.length - 1
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={1}
              fill={barFill}
              fillOpacity={active ? 1 : 0.42}
              filter={active ? `url(#${glowFilterId})` : undefined}
            />
          )
        })}
      </svg>
    )
  }

  // Line variant — Catmull-Rom-smoothed cubic bezier
  const stepX = data.length > 1 ? width / (data.length - 1) : width
  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * (height - 2) - 1
    return [x, y] as const
  })

  const linePath = smoothPath(points)
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`
  const last = points[points.length - 1]!
  const stroke = color ?? `url(#${lineGradId})`
  const dotFill = color ?? '#D6FF3E'
  const areaFill = color
    ? color
    : `url(#${areaGradId})`

  return (
    <svg
      width={width}
      height={height}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
    >
      {Defs}
      <path
        d={areaPath}
        fill={areaFill}
        fillOpacity={color ? 0.16 : undefined}
      />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Glow halo behind the endpoint dot */}
      <circle
        cx={last[0]}
        cy={last[1]}
        r={3.2}
        fill={dotFill}
        opacity={0.45}
        filter={`url(#${glowFilterId})`}
      />
      <circle cx={last[0]} cy={last[1]} r={1.8} fill={dotFill} />
    </svg>
  )
}

/**
 * Catmull-Rom → cubic-bezier conversion. Given N points, produces a
 * smooth path string. The math: for each segment p1→p2, the bezier
 * control points are derived from p0 and p3 with a tension factor.
 * Endpoints duplicate the first/last point so the curve doesn't
 * shoot out of bounds.
 */
function smoothPath(points: ReadonlyArray<readonly [number, number]>): string {
  if (points.length === 0) return ''
  if (points.length === 1) {
    const [x, y] = points[0]!
    return `M ${x} ${y}`
  }
  if (points.length === 2) {
    const [x0, y0] = points[0]!
    const [x1, y1] = points[1]!
    return `M ${x0} ${y0} L ${x1} ${y1}`
  }

  const tension = 0.5
  let d = `M ${points[0]![0]} ${points[0]![1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[i + 2] ?? p2
    const cp1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension
    const cp1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension
    const cp2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension
    const cp2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`
  }
  return d
}

// Small id helper so each Sparkline gets distinct gradient/filter ids
// when several render on the same page (e.g. the dashboard 4-up stats).
let _seq = 0
function useUid(): string {
  // We don't need useId() — the sparkline is render-to-string safe
  // and we only need uniqueness within a single page render. Module
  // counter is enough.
  return String(++_seq)
}
