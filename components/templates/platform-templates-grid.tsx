import type { ReactNode } from 'react'
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
  tileBg: string
  description: string
  structure: string
  /** Editorial micro-fact about the format. */
  format: string
}

const PLATFORM_TEMPLATES: PlatformTemplate[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    Logo: TikTokLogo,
    tileBg: 'bg-black',
    description: 'Hook-heavy vertical short-form. Energetic, trending audio.',
    structure: 'Hook → Value → CTA + Hashtags',
    format: '15–60s · Vertical · 9:16',
  },
  {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    Logo: InstagramLogo,
    tileBg: 'bg-gradient-to-br from-[#FEDA77] via-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    description: 'Aesthetic short-form, caption-driven with visual storytelling.',
    structure: 'Visual Hook → Story → Caption + Hashtags',
    format: 'Up to 90s · Vertical · 9:16',
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    Logo: YouTubeLogo,
    tileBg: 'bg-[#FF0000]',
    description: 'Up to 60s, educational tone OK, search-optimised title.',
    structure: 'Hook → Main Point → CTA to long-form',
    format: 'Up to 60s · Vertical · 9:16',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    Logo: LinkedInLogo,
    tileBg: 'bg-[#0A66C2]',
    description: 'Text-first professional post, thought-leadership angle.',
    structure: 'Bold opener → Story → Takeaway → Engagement Q',
    format: 'Text post · 1300 char target',
  },
]

/**
 * Read-only grid of the 4 built-in platform templates. Each card uses
 * the platform's real brand logo + tile colour so the whole page reads
 * "this is what TikTok / IG / YouTube / LinkedIn drafts will look like"
 * at a glance rather than generic typographic cards.
 */
export function PlatformTemplatesGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PLATFORM_TEMPLATES.map((t) => {
        const Logo = t.Logo
        return (
          <div
            key={t.id}
            className="group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm shadow-primary/[0.02] transition-all hover:-translate-y-px hover:border-border hover:shadow-md hover:shadow-primary/[0.04]"
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${t.tileBg}`}
                aria-hidden
              >
                <Logo size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-foreground">{t.name}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  {t.format}
                </p>
              </div>
            </div>

            <p className="text-[12.5px] leading-snug text-muted-foreground">
              {t.description}
            </p>

            {/* Structure hint as a mono "data-sheet" footer */}
            <div className="mt-auto flex items-start gap-2 rounded-lg border border-border/40 bg-muted/30 px-2.5 py-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                Structure
              </span>
              <span className="font-mono text-[10.5px] text-foreground/80">
                {t.structure}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
