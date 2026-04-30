'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  Building2,
  Check,
  Clapperboard,
  Layers,
  Loader2,
  Mic2,
  ShoppingBag,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react'

import { setActiveNicheAction } from './actions'
import { NICHE_PRESETS, type NicheId } from '@/lib/niche/presets'

interface NichePickerProps {
  workspaceId: string
  initialNiche: NicheId | null
}

/** Per-niche visual identity — single-color violet system across
 *  all six. Each niche gets its own Lucide icon but the chip
 *  background, foreground, and halo glow all live in the brand's
 *  primary-violet palette. The niches read as one designed family,
 *  not six rainbow vibes. */
/**
 * Single-color brand-plum system across all six niches. Background
 * gradients live in the plum-soft range (#F2EEF7 → #DCCFEA, matched
 * to the --plum-soft / --plum-soft-2 tokens), foregrounds in deep
 * plum, halo glows in plum rgba. Each niche carries its own Lucide
 * icon — the visual variation comes from the icon, not the colour.
 */
const NICHE_VISUAL: Record<
  NicheId,
  { Icon: LucideIcon; bg: string; fg: string; glow: string }
> = {
  creator: {
    Icon: Clapperboard,
    bg: 'linear-gradient(140deg, #F2EEF7 0%, #DCCFEA 100%)',
    fg: '#0F0F0F',
    glow: 'rgba(15,15,15,0.28)',
  },
  podcaster: {
    Icon: Mic2,
    bg: 'linear-gradient(140deg, #EDE6F2 0%, #D3C2E2 100%)',
    fg: '#1A0F2A',
    glow: 'rgba(15,15,15,0.32)',
  },
  coach: {
    Icon: Target,
    bg: 'linear-gradient(140deg, #F2EEF7 0%, #DCCFEA 100%)',
    fg: '#0F0F0F',
    glow: 'rgba(15,15,15,0.26)',
  },
  saas: {
    Icon: Briefcase,
    bg: 'linear-gradient(140deg, #EDE6F2 0%, #D3C2E2 100%)',
    fg: '#0F0F0F',
    glow: 'rgba(15,15,15,0.30)',
  },
  ecommerce: {
    Icon: ShoppingBag,
    bg: 'linear-gradient(140deg, #F2EEF7 0%, #DCCFEA 100%)',
    fg: '#0F0F0F',
    glow: 'rgba(15,15,15,0.26)',
  },
  agency: {
    Icon: Building2,
    bg: 'linear-gradient(140deg, #E6DCEF 0%, #C9B5DC 100%)',
    fg: '#1A0F2A',
    glow: 'rgba(15,15,15,0.32)',
  },
}

export function NichePicker({ workspaceId, initialNiche }: NichePickerProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<NicheId | null>(initialNiche)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  function choose(niche: NicheId | '') {
    const nextId = niche === '' ? null : niche
    setPendingId(niche || 'clear')
    setError(null)

    startTransition(async () => {
      const fd = new FormData()
      fd.set('workspace_id', workspaceId)
      fd.set('niche', niche)

      const result = await setActiveNicheAction({}, fd)
      setPendingId(null)

      if (result.ok) {
        setSelected(nextId)
        setSavedAt(nextId ? NICHE_PRESETS[nextId].name : 'Cleared')
        router.refresh()
        setTimeout(() => setSavedAt(null), 2500)
      } else if (result.ok === false) {
        setError(result.error)
      }
    })
  }

  const presetEntries = Object.values(NICHE_PRESETS)
  const activeName = selected ? NICHE_PRESETS[selected].name : null
  const hintLine = savedAt
    ? savedAt === 'Cleared'
      ? 'Selection cleared — drafts will use the platform defaults only.'
      : `${savedAt} preset is now layered on every new draft.`
    : activeName
      ? `${activeName} preset is currently layered on every new draft.`
      : 'No niche layered yet — pick one to apply industry tone on top of the platform defaults.'

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/75"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <span aria-hidden className="inline-block h-px w-5 bg-primary/40" />
            02
            <span className="text-primary/30">·</span>
            <span className="text-muted-foreground/70">section</span>
          </p>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/[0.09] text-primary">
              <Target className="h-3.5 w-3.5" />
            </span>
            <h2
              className="text-[20px] font-bold leading-tight tracking-tight text-foreground sm:text-[22px]"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              Niche preset
            </h2>
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {hintLine}
          </p>
        </div>
        {selected !== null ? (
          <button
            type="button"
            onClick={() => choose('')}
            disabled={isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 text-[12px] font-semibold tracking-tight text-muted-foreground transition-all hover:-translate-y-px hover:border-destructive/40 hover:text-destructive hover:shadow-sm disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            <X className="h-3 w-3" />
            Clear selection
          </button>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-[12px] font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {presetEntries.map((n) => {
          const isActive = selected === n.id
          const isLoading = pendingId === n.id && isPending
          const visual = NICHE_VISUAL[n.id]
          const Icon = visual.Icon

          return (
            <button
              key={n.id}
              type="button"
              onClick={() => choose(n.id)}
              disabled={isPending}
              className={`group relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 text-left transition-all disabled:opacity-80 ${
                isActive
                  ? ''
                  : 'border border-border/60 bg-card hover:-translate-y-px hover:border-border'
              }`}
              style={
                isActive
                  ? {
                      border: '1.5px solid transparent',
                      backgroundImage:
                        'linear-gradient(var(--card), var(--card)), linear-gradient(140deg, #F4D93D 0%, #DCB91F 70%, #F4D93D 100%)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.55), 0 14px 32px -18px rgba(220,185,31,0.40)',
                    }
                  : {
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.55), 0 12px 28px -22px rgba(15,15,15,0.10)',
                    }
              }
            >
              {/* Tone-tinted glow tucked behind the icon chip */}
              <span
                aria-hidden
                className="pointer-events-none absolute -left-6 -top-8 h-24 w-24 rounded-full opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle, ${visual.glow} 0%, transparent 60%)`,
                }}
              />
              {!isActive ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                />
              ) : null}

              {/* Top-right state token: Active / loader / Apply hint */}
              {isActive ? (
                <span
                  className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
                  style={{
                    background: 'var(--lime-soft, #D6FF3E)',
                    color: '#1a2000',
                    boxShadow: '0 4px 10px -4px rgba(214,255,62,0.55)',
                    fontFamily:
                      'var(--font-inter-tight), var(--font-inter), sans-serif',
                  }}
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  Active
                </span>
              ) : isLoading ? (
                <span className="absolute right-3 top-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                </span>
              ) : (
                <span
                  className="absolute right-3 top-3 inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/0 transition-all group-hover:border-primary/30 group-hover:text-primary"
                  style={{
                    fontFamily:
                      'var(--font-inter-tight), var(--font-inter), sans-serif',
                  }}
                >
                  Apply →
                </span>
              )}

              <div className="relative flex items-start gap-3 pr-16">
                <span
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: visual.bg,
                    color: visual.fg,
                    boxShadow:
                      '0 1px 0 rgba(255,255,255,0.5) inset, 0 6px 14px -6px rgba(15,15,15,0.18)',
                  }}
                  aria-hidden
                >
                  <span
                    className="pointer-events-none absolute inset-1 rounded-[12px]"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 50%)',
                    }}
                  />
                  <Icon className="relative h-[18px] w-[18px]" strokeWidth={1.85} />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[14px] font-bold leading-tight tracking-tight text-foreground"
                    style={{
                      fontFamily:
                        'var(--font-inter-tight), var(--font-inter), sans-serif',
                    }}
                  >
                    {n.name}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                    {n.description}
                  </p>
                </div>
              </div>

              {/* Tone footer — designed block, not mono inline. */}
              <div className="relative mt-auto rounded-xl border border-border/55 bg-muted/25 px-3 py-2.5">
                <p
                  className="mb-1 inline-flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-primary/70"
                  style={{
                    fontFamily:
                      'var(--font-inter-tight), var(--font-inter), sans-serif',
                  }}
                >
                  <span
                    aria-hidden
                    className="inline-block h-px w-3 bg-primary/40"
                  />
                  Tone
                </p>
                <p className="line-clamp-3 text-[12px] leading-snug text-foreground/85">
                  {n.tone}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-[11.5px] leading-snug text-muted-foreground/90">
        <Layers className="h-3 w-3 text-primary/70" />
        <span>
          Layered on top of platform templates ·{' '}
          <span className="font-semibold text-foreground/85">
            changes apply to new drafts immediately
          </span>
        </span>
      </p>
    </section>
  )
}
