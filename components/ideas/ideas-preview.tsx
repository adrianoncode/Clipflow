import { ArrowRight, Clock, Copy, Sparkles } from 'lucide-react'

/**
 * Static preview shown above the Idea generator form before the user
 * has run a generation. Mocks two realistic idea cards so the user
 * sees the shape of the output instead of staring at a bare form.
 *
 * Aria-hidden / non-interactive — purely a "this is what you'll get"
 * teaser. Same visual language as the real <IdeaCard>.
 */

const SAMPLES: Array<{
  title: string
  hook: string
  outline: string[]
  platforms: string[]
  minutes: number
}> = [
  {
    title: 'The 3 metrics every indie founder gets wrong',
    hook: 'I tracked the wrong number for 18 months. Here’s what actually predicts churn.',
    outline: [
      'Why activation rate beats signup rate',
      'The 7-day cohort tell',
      'One dashboard that catches drift early',
    ],
    platforms: ['TikTok', 'Shorts', 'LinkedIn'],
    minutes: 4,
  },
  {
    title: 'How we cut burnout while shipping weekly',
    hook: 'Shipping every Friday almost killed the company. The fix wasn’t fewer features.',
    outline: [
      'The “fake productivity” trap',
      'A meeting we delete every quarter',
      'What we replaced standups with',
    ],
    platforms: ['LinkedIn', 'YouTube'],
    minutes: 6,
  },
]

export function IdeasPreview() {
  return (
    <div aria-hidden className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <p
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        >
          What ideas look like
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {SAMPLES.map((s, i) => (
          <article
            key={i}
            className="relative flex flex-col gap-3 rounded-2xl border bg-card p-4 opacity-90"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[14.5px] font-bold leading-tight text-foreground">
                {s.title}
              </h3>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground/30">
                <Copy className="h-3 w-3" />
              </span>
            </div>
            <p className="rounded-lg bg-primary/[0.05] px-3 py-2 text-[12.5px] italic leading-snug text-primary">
              &ldquo;{s.hook}&rdquo;
            </p>
            <ul className="space-y-1 text-[12px] leading-relaxed text-muted-foreground">
              {s.outline.map((line, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[3px] block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-center justify-between border-t pt-3">
              <div className="flex flex-wrap gap-1">
                {s.platforms.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/70">
                <Clock className="h-3 w-3" />
                {s.minutes}m
              </span>
            </div>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/[0.04] py-1.5 text-[11.5px] font-bold text-primary/70">
              Record this
              <ArrowRight className="h-3 w-3" />
            </span>
          </article>
        ))}
      </div>
    </div>
  )
}
