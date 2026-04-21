'use client'

/**
 * Editorial SVG flow diagrams — one visual per common Clipflow
 * workflow. Used on Use-case pages to show the pipeline at a glance.
 *
 * All three are pure SVG (no canvas, no JS). They scale to their
 * container, respect the lv2-primary + lv2-accent palette, and
 * render cleanly at small widths.
 */

const BASE_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.5,
}

/* ── Core repurposing pipeline ─────────────────────────────────── */
export function PipelineFlowDiagram() {
  const steps = [
    { label: 'Upload', sub: 'MP4 / YouTube / paste' },
    { label: 'Transcribe', sub: '~30 sec' },
    { label: 'Find clips', sub: 'virality score' },
    { label: 'Write captions', sub: 'brand voice' },
    { label: 'Schedule', sub: '4 platforms' },
  ]
  return (
    <FlowShell title="The repurposing pipeline" steps={steps} accents={[2, 3]} />
  )
}

/* ── Podcast-specific flow with RSS auto-import ────────────────── */
export function RssFlowDiagram() {
  const steps = [
    { label: 'RSS feed', sub: 'added once' },
    { label: 'New episode', sub: 'auto-detected' },
    { label: 'Transcribe', sub: 'automatic' },
    { label: '12+ clips', sub: 'ranked by hook' },
    { label: 'Scheduled', sub: 'across the week' },
  ]
  return <FlowShell title="Podcast RSS → scheduled week" steps={steps} accents={[1, 4]} />
}

/* ── Agency multi-client workflow ──────────────────────────────── */
export function AgencyFlowDiagram() {
  const steps = [
    { label: 'Client A', sub: 'own Brand Kit' },
    { label: 'Record', sub: 'one workspace' },
    { label: 'Draft', sub: "client's voice" },
    { label: 'Review link', sub: 'white-labeled' },
    { label: 'Publish', sub: 'client approved' },
  ]
  return <FlowShell title="Agency workflow per client" steps={steps} accents={[0, 3]} />
}

/* ── Shared chrome ─────────────────────────────────────────────── */
function FlowShell({
  title,
  steps,
  accents,
}: {
  title: string
  steps: Array<{ label: string; sub: string }>
  /** Indexes of steps rendered in accent color (Clipflow's unique contribution). */
  accents: number[]
}) {
  return (
    <div>
      <p
        className="lv2-mono-label mb-5"
        style={{ color: 'var(--lv2-muted)', fontSize: 10 }}
      >
        {title}
      </p>
      <div className="flex flex-wrap items-stretch gap-0">
        {steps.map((s, i) => {
          const isAccent = accents.includes(i)
          const isLast = i === steps.length - 1
          return (
            <div
              key={s.label}
              className="flex flex-1 min-w-[120px] items-stretch gap-2"
            >
              <div
                className="flex flex-1 flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-center"
                style={{
                  background: isAccent ? 'var(--lv2-primary)' : 'var(--lv2-bg-2)',
                  color: isAccent ? 'var(--lv2-accent)' : 'var(--lv2-fg)',
                  border: '1px solid var(--lv2-border)',
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    background: isAccent ? 'var(--lv2-accent)' : 'var(--lv2-primary-soft)',
                    color: isAccent ? 'var(--lv2-primary)' : 'var(--lv2-primary)',
                  }}
                  aria-hidden
                >
                  <span
                    className="lv2-mono text-[11px] font-bold"
                    style={{ letterSpacing: 0 }}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                </div>
                <p
                  className="text-[12px] font-bold leading-tight"
                  style={{
                    color: isAccent ? 'var(--lv2-accent)' : 'var(--lv2-fg)',
                  }}
                >
                  {s.label}
                </p>
                <p
                  className="lv2-mono text-[9px] uppercase tracking-wider"
                  style={{
                    color: isAccent
                      ? 'rgba(214,255,62,.55)'
                      : 'var(--lv2-muted)',
                  }}
                >
                  {s.sub}
                </p>
              </div>
              {!isLast ? <Arrow /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <svg
      width="24"
      height="60"
      viewBox="0 0 24 60"
      style={{ color: 'var(--lv2-border)', alignSelf: 'center' }}
      aria-hidden
    >
      <path d="M 4 30 L 20 30" {...BASE_PROPS} />
      <path d="M 14 24 L 20 30 L 14 36" {...BASE_PROPS} />
    </svg>
  )
}
