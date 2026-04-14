interface SparklineProps {
  /** Data points in chronological order (oldest first). */
  data: number[]
  /** Width in px. The SVG scales to this. */
  width?: number
  /** Height in px. */
  height?: number
  /** Stroke color of the line. Defaults to the primary CSS var. */
  color?: string
  /** If true, render as tiny vertical bars instead of a line. */
  variant?: 'line' | 'bars'
  /** Optional aria label. */
  label?: string
}

/**
 * Zero-dependency sparkline. Renders as inline SVG — works server-side,
 * no client JS. Line variant draws a smooth polyline + soft area fill;
 * bar variant draws mini columns for a more "data desk" look.
 *
 * Empty/flat data degrades to a single mid-height baseline.
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'hsl(var(--primary))',
  variant = 'line',
  label,
}: SparklineProps) {
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

  if (variant === 'bars') {
    const barGap = 2
    const barWidth = (width - barGap * (data.length - 1)) / data.length
    return (
      <svg
        width={width}
        height={height}
        role={label ? 'img' : 'presentation'}
        aria-label={label}
      >
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
              fill={color}
              fillOpacity={active ? 1 : 0.35}
            />
          )
        })}
      </svg>
    )
  }

  // Line variant
  const stepX = data.length > 1 ? width / (data.length - 1) : width
  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * (height - 2) - 1
    return [x, y] as const
  })
  const line = points.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `0,${height} ${line} ${width},${height}`

  return (
    <svg
      width={width}
      height={height}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
    >
      <polygon points={area} fill={color} fillOpacity={0.12} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.length > 0 ? (
        <circle
          cx={points[points.length - 1]![0]}
          cy={points[points.length - 1]![1]}
          r={2}
          fill={color}
        />
      ) : null}
    </svg>
  )
}
