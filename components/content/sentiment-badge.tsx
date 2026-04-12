'use client'

export interface SentimentData {
  overall: string
  energy: string
  emotions: string[]
  score: number
  summary: string
}

interface SentimentBadgeProps {
  sentiment: SentimentData | null
}

const OVERALL_COLORS: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  mixed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const ENERGY_COLORS: Record<string, string> = {
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  if (!sentiment) return null

  const overallClass = OVERALL_COLORS[sentiment.overall] ?? OVERALL_COLORS.neutral
  const energyClass = ENERGY_COLORS[sentiment.energy] ?? ENERGY_COLORS.medium

  // Score bar: -1 to +1, centered at 0
  // Map to 0–100% width from center
  const scorePercent = Math.round(Math.abs(sentiment.score) * 50)
  const isPositive = sentiment.score >= 0

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2.5 text-sm">
      {/* Top row: overall + energy */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${overallClass}`}
        >
          {sentiment.overall}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs capitalize ${energyClass}`}
        >
          {sentiment.energy} energy
        </span>
      </div>

      {/* Emotion pills */}
      {sentiment.emotions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sentiment.emotions.map((emotion) => (
            <span
              key={emotion}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize"
            >
              {emotion}
            </span>
          ))}
        </div>
      )}

      {/* Score bar */}
      <div className="space-y-0.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>-1</span>
          <span className="font-medium text-foreground">
            Score: {sentiment.score.toFixed(2)}
          </span>
          <span>+1</span>
        </div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
          {/* Score bar */}
          <div
            className={`absolute top-0 h-full rounded-full transition-all ${
              isPositive ? 'bg-emerald-500 left-1/2' : 'bg-red-400 right-1/2'
            }`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Summary */}
      {sentiment.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed">{sentiment.summary}</p>
      )}
    </div>
  )
}
