import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import {
  InstagramLogo,
  LinkedInLogo,
  TikTokLogo,
  YouTubeLogo,
} from '@/components/brand-logos'

interface PlatformTemplate {
  id: string
  name: string
  Logo: (props: { size?: number; className?: string }) => ReactNode
  /** Brand-tone gradient applied to the logo chip + halo glow. */
  tileBg: string
  /** rgba glow color tucked behind the logo chip. */
  glow: string
  description: string
  /** Sequential draft structure — rendered as a flow with arrow tokens. */
  structure: string[]
  /** Editorial micro-fact about the format. Two short pills. */
  formatPills: string[]
}

const PLATFORM_TEMPLATES: PlatformTemplate[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    Logo: TikTokLogo,
    tileBg: 'linear-gradient(140deg, #1F1F1F 0%, #050505 100%)',
    glow: 'rgba(0,0,0,0.45)',
    description: 'Hook-heavy vertical short-form. Energetic, trending audio.',
    structure: ['Hook', 'Value', 'CTA + Hashtags'],
    formatPills: ['15–60 s', 'Vertical · 9:16'],
  },
  {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    Logo: InstagramLogo,
    tileBg:
      'linear-gradient(135deg, #FEDA77 0%, #F58529 30%, #DD2A7B 65%, #8134AF 100%)',
    glow: 'rgba(221,42,123,0.40)',
    description: 'Aesthetic short-form, caption-driven with visual storytelling.',
    structure: ['Visual Hook', 'Story', 'Caption + Hashtags'],
    formatPills: ['Up to 90 s', 'Vertical · 9:16'],
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    Logo: YouTubeLogo,
    tileBg: 'linear-gradient(140deg, #FF3B30 0%, #C40000 100%)',
    glow: 'rgba(255,0,0,0.40)',
    description: 'Up to 60s, educational tone OK, search-optimised title.',
    structure: ['Hook', 'Main Point', 'CTA to long-form'],
    formatPills: ['Up to 60 s', 'Vertical · 9:16'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    Logo: LinkedInLogo,
    tileBg: 'linear-gradient(140deg, #0A66C2 0%, #074C8E 100%)',
    glow: 'rgba(10,102,194,0.40)',
    description: 'Text-first professional post, thought-leadership angle.',
    structure: ['Bold opener', 'Story', 'Takeaway', 'Engagement Q'],
    formatPills: ['Text post', '1300 char target'],
  },
]

/**
 * Read-only grid of the 4 built-in platform templates. Each card pairs
 * the platform's real brand logo with a tone-tinted halo, an editorial
 * description, and the draft structure rendered as a real flow with
 * arrow tokens — instead of a grey-mono "STRUCTURE: X → Y → Z" inline
 * caption that read as data-sheet boilerplate.
 */
export function PlatformTemplatesGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PLATFORM_TEMPLATES.map((t) => {
        const Logo = t.Logo
        return (
          <div
            key={t.id}
            className="group relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-px hover:border-border"
            style={{
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(15,15,15,0.04), 0 12px 28px -20px rgba(15,15,15,0.20)',
            }}
          >
            {/* Top-edge highlight + tone-tinted glow tucked behind the
                logo chip — gives the card real depth, telegraphs the
                platform identity without painting the whole tile. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-60 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: `radial-gradient(circle, ${t.glow} 0%, transparent 65%)`,
              }}
            />

            <div className="relative flex items-start gap-3">
              <span
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                style={{
                  background: t.tileBg,
                  boxShadow: `0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 18px -8px ${t.glow}`,
                }}
                aria-hidden
              >
                <span
                  className="pointer-events-none absolute inset-1 rounded-[10px]"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 50%)',
                  }}
                />
                <Logo size={20} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className="text-[15px] font-bold leading-tight tracking-tight text-foreground"
                  style={{
                    fontFamily:
                      'var(--font-inter-tight), var(--font-inter), sans-serif',
                  }}
                >
                  {t.name}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {t.formatPills.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10.5px] font-medium tracking-tight text-muted-foreground"
                      style={{
                        fontFamily:
                          'var(--font-inter-tight), var(--font-inter), sans-serif',
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <span
                className="flex h-6 items-center gap-1 rounded-full border border-border/60 bg-background px-2 text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground/85"
                title="Built-in default — read-only"
                style={{
                  fontFamily:
                    'var(--font-inter-tight), var(--font-inter), sans-serif',
                }}
              >
                <Lock className="h-2.5 w-2.5" />
                Built-in
              </span>
            </div>

            <p className="relative text-[13px] leading-relaxed text-muted-foreground">
              {t.description}
            </p>

            {/* Structure rendered as a real flow — the draft order is
                what users actually want to see, so make it readable
                rather than a mono caption. Arrow tokens in primary. */}
            <div className="relative mt-auto rounded-xl border border-border/55 bg-muted/25 px-3 py-2.5">
              <p
                className="mb-1.5 inline-flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-primary/70"
                style={{
                  fontFamily:
                    'var(--font-inter-tight), var(--font-inter), sans-serif',
                }}
              >
                <span
                  aria-hidden
                  className="inline-block h-px w-3 bg-primary/40"
                />
                Structure
              </p>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
                {t.structure.map((step, i) => (
                  <span key={step} className="inline-flex items-center gap-1.5">
                    <span
                      className="text-[12px] font-semibold tracking-tight text-foreground/90"
                      style={{
                        fontFamily:
                          'var(--font-inter-tight), var(--font-inter), sans-serif',
                      }}
                    >
                      {step}
                    </span>
                    {i < t.structure.length - 1 ? (
                      <span
                        aria-hidden
                        className="text-[11px] font-bold text-primary/55"
                      >
                        →
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
