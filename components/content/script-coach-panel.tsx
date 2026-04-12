'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, TrendingUp, Clock, MessageCircle, Target } from 'lucide-react'

interface CoachFeedback {
  hookScore: number
  hookFeedback: string
  lengthAnalysis: {
    wordCount: number
    estimatedSeconds: number
    isOptimal: boolean
    feedback: string
  }
  structureScore: number
  suggestions: string[]
  overallScore: number
  toneAnalysis: string
  ctaPresent: boolean
}

interface Props {
  workspaceId: string
  script: string
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{score}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}

export function ScriptCoachPanel({ workspaceId, script }: Props) {
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (script.length < 20) {
      setFeedback(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/script-coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId, script }),
        })
        const data = await res.json()
        if (data.ok) {
          setFeedback(data.feedback as CoachFeedback)
        } else {
          setError(data.error ?? 'Failed to analyze')
        }
      } catch {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }, 1500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [script, workspaceId])

  if (!script || script.length < 20) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Start typing to get real-time AI coaching...
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-violet-400" />
          Script Coach
        </div>
        {loading && (
          <span className="text-xs text-muted-foreground animate-pulse">Analyzing...</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {feedback && (
        <>
          {/* Scores row */}
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/30 p-3">
            <ScoreCircle score={feedback.overallScore} label="Overall" />
            <ScoreCircle score={feedback.hookScore} label="Hook" />
            <ScoreCircle score={feedback.structureScore} label="Structure" />
          </div>

          {/* Hook feedback */}
          {feedback.hookFeedback && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Target className="h-3 w-3" />
                Hook feedback
              </div>
              <p className="text-xs leading-relaxed text-foreground/80">{feedback.hookFeedback}</p>
            </div>
          )}

          {/* Length */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Clock className="h-3 w-3" />
              Length: ~{feedback.lengthAnalysis.estimatedSeconds}s ({feedback.lengthAnalysis.wordCount} words)
            </div>
            <p className="text-xs text-foreground/60">{feedback.lengthAnalysis.feedback}</p>
          </div>

          {/* Suggestions */}
          {feedback.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Suggestions
              </div>
              <ul className="space-y-1">
                {feedback.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                    <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA check */}
          <div className="flex items-center gap-1.5 text-xs">
            <MessageCircle className="h-3 w-3 text-muted-foreground" />
            <span className={feedback.ctaPresent ? 'text-emerald-400' : 'text-amber-400'}>
              {feedback.ctaPresent ? 'CTA detected ✓' : 'No clear CTA — consider adding one'}
            </span>
          </div>

          {/* Tone */}
          {feedback.toneAnalysis && (
            <p className="text-[10px] text-muted-foreground italic">{feedback.toneAnalysis}</p>
          )}
        </>
      )}
    </div>
  )
}
