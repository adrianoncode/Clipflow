'use client'

import Link from 'next/link'
import { ArrowRight, Check, Minus } from 'lucide-react'

import {
  type CompetitorId,
  type MatrixRow,
  COMPETITORS,
  MATRIX_ROWS,
} from '@/lib/landing/competitors'

/**
 * Comparison matrix — single source of truth is `lib/landing/competitors.ts`.
 *
 * Used on the landing (all competitors visible) AND on each
 * /compare/clipflow-vs-<competitor> page (filtered to one). The
 * filtered version shows a single competitor column beside Clipflow
 * so the side-by-side is easier to scan.
 */

interface ComparisonMatrixProps {
  /** Which competitor columns to render. Defaults to all three. */
  competitors?: CompetitorId[]
  /** Optional heading override — detail pages customize this. */
  headline?: React.ReactNode
  eyebrow?: string
  /** Optional "See full comparison" link from the landing — only set
   *  when the matrix is embedded on the landing, NOT on detail pages. */
  seeMoreHref?: string
  seeMoreLabel?: string
}

export function ComparisonMatrix({
  competitors = ['opusclip', 'klap', 'descript'],
  headline,
  eyebrow = 'Switching from?',
  seeMoreHref,
  seeMoreLabel,
}: ComparisonMatrixProps) {
  const competitorMetas = competitors.map((id) => COMPETITORS[id])
  const cols = competitorMetas.length
  const gridCols = `2fr ${Array.from({ length: cols + 1 })
    .map(() => '0.8fr')
    .join(' ')}`

  return (
    <section
      className="mx-auto max-w-[1240px] px-6 py-24"
      style={{ borderTop: '1px solid var(--lv2-border)' }}
    >
      <div className="lv2-reveal mb-12 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="lv2-mono-label mb-3">{eyebrow}</p>
          <h2
            className="lv2-display max-w-[640px] text-[44px] leading-[1.02] sm:text-[56px]"
            style={{ color: 'var(--lv2-primary)' }}
          >
            {headline ?? (
              <>
                What {competitorMetas.map((c) => c.name).join(' and ')} don&apos;t do.
              </>
            )}
          </h2>
        </div>
        <p className="max-w-[340px] text-[15px]" style={{ color: 'var(--lv2-muted)' }}>
          Honest side-by-side. If a row isn&rsquo;t checked for us, it&rsquo;s not in this
          matrix — we only list what we ship.
        </p>
      </div>

      <div
        className="lv2-reveal overflow-hidden rounded-[20px]"
        style={{
          border: '1px solid var(--lv2-border)',
          background: 'var(--lv2-card)',
        }}
      >
        {/* Header row */}
        <div
          className="grid items-center border-b text-[12.5px] font-bold"
          style={{ borderColor: 'var(--lv2-border)', gridTemplateColumns: gridCols }}
        >
          <div className="px-5 py-4">
            <span className="lv2-mono-label">Capability</span>
          </div>
          <div
            className="flex items-center justify-center gap-1.5 px-3 py-4 text-center"
            style={{
              background: 'var(--lv2-primary)',
              color: 'var(--lv2-accent)',
            }}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-md"
              style={{ background: 'var(--lv2-accent)' }}
            >
              <span
                className="block h-2 w-2 rounded-[2px]"
                style={{ background: 'var(--lv2-primary)' }}
              />
            </span>
            <span className="text-[13px]">Clipflow</span>
          </div>
          {competitorMetas.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-center px-3 py-4 text-center"
              style={{ color: 'var(--lv2-muted)' }}
            >
              {c.name}
            </div>
          ))}
        </div>

        {/* Rows */}
        {MATRIX_ROWS.map((row: MatrixRow) => (
          <div
            key={row.label}
            className="grid items-stretch border-b text-[13px] transition-colors last:border-b-0 hover:bg-black/[.02]"
            style={{ borderColor: 'var(--lv2-border)', gridTemplateColumns: gridCols }}
          >
            <div className="flex flex-col justify-center px-5 py-4">
              <p
                className="font-semibold leading-snug"
                style={{
                  color: row.highlight ? 'var(--lv2-primary)' : 'var(--lv2-fg)',
                }}
              >
                {row.label}
                {row.highlight && (
                  <span
                    className="lv2-mono ml-2 inline-block align-middle"
                    style={{
                      background: 'var(--lv2-accent)',
                      color: 'var(--lv2-accent-ink)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                    }}
                  >
                    ONLY CLIPFLOW
                  </span>
                )}
              </p>
              {row.detail ? (
                <p
                  className="mt-0.5 text-[11.5px] leading-snug"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  {row.detail}
                </p>
              ) : null}
            </div>
            <CellValue value={row.clipflow} strong />
            {competitorMetas.map((c) => (
              <CellValue key={c.id} value={row.values[c.id] ?? false} />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p
          className="lv2-mono text-[10.5px]"
          style={{ color: 'var(--lv2-muted)', letterSpacing: '0.04em' }}
        >
          PUBLIC PRICING + DOCS OF EACH TOOL · APRIL 2026 · UPDATES WELCOME
        </p>
        {seeMoreHref ? (
          <Link
            href={seeMoreHref}
            className="group inline-flex items-center gap-1.5 text-[13px] font-semibold"
            style={{ color: 'var(--lv2-primary)' }}
          >
            {seeMoreLabel ?? 'See the full comparison'}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
    </section>
  )
}

function CellValue({ value, strong }: { value: boolean | string; strong?: boolean }) {
  const isYes = value === true
  const isNo = value === false

  return (
    <div
      className="flex items-center justify-center border-l px-3 py-4 text-center"
      style={{
        borderColor: 'var(--lv2-border)',
        background: strong ? 'rgba(214,255,62,.06)' : 'transparent',
      }}
    >
      {isYes ? (
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: strong ? 'var(--lv2-primary)' : 'var(--lv2-primary-soft)',
            color: strong ? 'var(--lv2-accent)' : 'var(--lv2-primary)',
          }}
          aria-label="Yes"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      ) : isNo ? (
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: 'var(--lv2-bg-2)', color: 'var(--lv2-muted)' }}
          aria-label="No"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      ) : (
        <span
          className="text-[11px] font-semibold leading-tight"
          style={{ color: 'var(--lv2-muted)' }}
        >
          {value}
        </span>
      )}
    </div>
  )
}
