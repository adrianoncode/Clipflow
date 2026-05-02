'use client'

import { useState } from 'react'
import { ArrowUpRight, Plus, Sparkles, Tag } from 'lucide-react'

import { BrandLogo } from '@/components/ai-keys/brand-logo'
import { DeleteAiKeyButton } from '@/components/ai-keys/delete-ai-key-button'
import { AddServiceKeyDialog } from '@/components/ai-keys/add-service-key-dialog'
import { PremiumButton } from '@/components/ui/premium-button'
import type { ServiceSpec } from '@/components/ai-keys/service-directory'
import type { AiKeySummary } from '@/lib/ai/get-ai-keys'
import type { AiProvider } from '@/lib/ai/providers/types'

interface ServiceCardProps {
  spec: ServiceSpec
  connectedKeys: AiKeySummary[]
  workspaceId: string
  /** Owner-only can add/remove keys. */
  isOwner: boolean
}

/**
 * Per-provider tone — drives the halo glow tucked behind the logo
 * chip and the free-tier-note tint. Real brand colors so each row
 * carries its provider's identity instead of one generic violet.
 */
const PROVIDER_TONE: Record<
  AiProvider,
  { glow: string; tag: { bg: string; fg: string } }
> = {
  openai: {
    glow: 'rgba(15,15,15,0.32)',
    tag: { bg: 'rgba(15,15,15,0.06)', fg: '#181511' },
  },
  anthropic: {
    glow: 'rgba(212,88,11,0.32)',
    tag: { bg: 'rgba(212,88,11,0.10)', fg: '#A0530B' },
  },
  google: {
    glow: 'rgba(15,15,15,0.32)',
    tag: { bg: 'rgba(15,15,15,0.10)', fg: '#1A1A1A' },
  },
  shotstack: {
    glow: 'rgba(15,15,15,0.36)',
    tag: { bg: 'rgba(15,15,15,0.10)', fg: '#1A1A1A' },
  },
  replicate: {
    glow: 'rgba(15,15,15,0.32)',
    tag: { bg: 'rgba(15,15,15,0.06)', fg: '#181511' },
  },
  elevenlabs: {
    glow: 'rgba(15,15,15,0.32)',
    tag: { bg: 'rgba(15,15,15,0.06)', fg: '#181511' },
  },
  'upload-post': {
    glow: 'rgba(16,185,129,0.32)',
    tag: { bg: 'rgba(16,185,129,0.10)', fg: '#047857' },
  },
  zapcap: {
    glow: 'rgba(244,217,61,0.36)',
    tag: { bg: 'rgba(244,217,61,0.16)', fg: '#7A6500' },
  },
}

/**
 * Per-provider editorial subtitle — the model line that sits under
 * the provider name. Keeps the row from reading as a flat label
 * stack and tells the user *what they are connecting* at a glance.
 */
const PROVIDER_SUBTITLE: Partial<Record<AiProvider, string>> = {
  openai: 'GPT-4o · GPT-5 · Whisper',
  anthropic: 'Claude 3.7 Sonnet · Opus',
  google: 'Gemini 2.0 Flash · Pro',
  shotstack: 'MP4 render · captions · b-roll',
  replicate: 'AI avatars · smart reframe',
  elevenlabs: 'Voice clone · auto-dub · TTS',
  'upload-post': 'TikTok · IG · YouTube · LinkedIn',
  zapcap: 'Animated captions · MrBeast · Hormozi',
}

/**
 * One row inside an AI-keys section. Premium chassis: per-provider
 * halo glow hidden behind the logo chip, lively typography stack
 * (Inter-Tight name, mono model line, foreground description, mono
 * cost), interactive Connect button with a diagonal lime-shimmer
 * sweep on hover.
 */
export function ServiceCard({
  spec,
  connectedKeys,
  workspaceId,
  isOwner,
}: ServiceCardProps) {
  const [adding, setAdding] = useState(false)
  const isConnected = connectedKeys.length > 0
  const tone = PROVIDER_TONE[spec.provider]
  const subtitle = PROVIDER_SUBTITLE[spec.provider]

  return (
    <div
      className={`group relative overflow-hidden transition-colors ${
        isConnected ? 'bg-emerald-50/[0.35]' : 'hover:bg-muted/[0.18]'
      }`}
    >
      {/* Per-provider halo tucked behind the logo. Subtle until hover,
          where it glows up to telegraph "this row is alive". */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-10 h-36 w-36 rounded-full opacity-50 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle, ${tone.glow} 0%, transparent 65%)`,
        }}
      />

      {/* hairline accent on the left when connected */}
      {isConnected && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-emerald-400/0 via-emerald-400 to-emerald-400/0"
        />
      )}

      <div className="relative flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:gap-5 sm:px-6 sm:py-6">
        <BrandLogo
          provider={spec.provider}
          size={52}
          className="transition-transform duration-300 group-hover:-rotate-[3deg] group-hover:scale-[1.06]"
        />

        <div className="min-w-0 flex-1 space-y-2">
          {/* Header row — provider name + connection state + free-tier
              chip. Name pulled to bigger inter-tight, state pill made
              dezenter so the name is the visual lead. */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h3
              className="text-[16px] font-bold leading-tight tracking-tight text-foreground"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              {spec.name}
            </h3>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/[0.14] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Connected
              </span>
            ) : null}
            {!isConnected && spec.freeTierNote && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold tracking-tight"
                style={{
                  background: tone.tag.bg,
                  color: tone.tag.fg,
                  fontFamily:
                    'var(--font-inter-tight), var(--font-inter), sans-serif',
                }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                {spec.freeTierNote}
              </span>
            )}
          </div>

          {/* Mono subtitle — model lineup. Anchors what the provider
              actually gives you under the name, in editorial mono. */}
          {subtitle ? (
            <p
              className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/55"
            >
              {subtitle}
            </p>
          ) : null}

          {/* Plain-language description — readable foreground/85, not
              dimmed muted. */}
          <p className="text-[13px] leading-relaxed text-foreground/85">
            {spec.description}
          </p>

          {/* Cost hint — mono tabular, anchored to a tiny tag glyph so
              it reads as metadata not a stray caption. */}
          <p
            className="inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums tracking-tight text-foreground/55"
          >
            <Tag className="h-2.5 w-2.5" />
            {spec.costHint}
          </p>

          {spec.publishPlatforms && spec.publishPlatforms.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {spec.publishPlatforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground"
                >
                  {platform}
                </span>
              ))}
            </div>
          )}
        </div>

        {isOwner && !isConnected && (
          <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
            <PremiumButton onClick={() => setAdding(true)} fullWidth={false}>
              <Plus className="h-3.5 w-3.5" />
              Connect
            </PremiumButton>
            <a
              href={spec.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-0.5 text-[10.5px] font-medium text-muted-foreground/70 transition-colors hover:text-primary sm:justify-end"
            >
              Get a key
              <ArrowUpRight className="h-2.5 w-2.5" />
            </a>
          </div>
        )}
      </div>

      {isConnected && (
        <div className="border-t border-emerald-500/15 bg-emerald-500/[0.04] px-5 py-3 sm:px-6">
          <ul className="space-y-2">
            {connectedKeys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="font-mono text-[11.5px] tracking-tight text-foreground/80">
                    {key.masked_preview ?? '••••••••••••'}
                  </span>
                  {key.label && (
                    <span className="truncate rounded-full bg-background px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                      {key.label}
                    </span>
                  )}
                </div>
                {isOwner && (
                  <DeleteAiKeyButton
                    keyId={key.id}
                    workspaceId={workspaceId}
                    label={key.label ?? spec.name}
                  />
                )}
              </li>
            ))}
          </ul>

          {isOwner && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <a
                href={spec.keyDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[10.5px] font-medium text-muted-foreground/70 transition-colors hover:text-primary"
              >
                Manage at {spec.name}
                <ArrowUpRight className="h-2.5 w-2.5" />
              </a>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2.5 py-1 text-[10.5px] font-semibold text-muted-foreground transition-all hover:-translate-y-px hover:border-foreground/30 hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                Add another
              </button>
            </div>
          )}
        </div>
      )}

      {adding && (
        <AddServiceKeyDialog
          spec={spec}
          workspaceId={workspaceId}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}

/**
 * Connect CTA — foreground-black pill with a diagonal lime shimmer
 * that sweeps across on hover (same vocabulary as the landing's
 * lv2-magnetic). Adds a top inner highlight so it reads as "lit
 * from above" rather than a flat rectangle.
 */
function ConnectButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cf-shimmer-btn group/cta relative inline-flex h-9 items-center justify-center gap-1.5 overflow-hidden rounded-lg px-3.5 text-[12.5px] font-bold tracking-tight transition-all duration-200 hover:-translate-y-px"
      style={{
        background:
          'linear-gradient(180deg, #0F0F0F 0%, #1A1A1A 100%)',
        color: '#F4D93D',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(214,255,62,0.18), 0 1px 2px rgba(15,15,15,0.18), 0 6px 14px -6px rgba(15,15,15,0.40)',
        fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
      }}
    >
      {/* Diagonal shimmer sweep — sits behind the label, slides on
          hover. Same trick as lv2-magnetic-shine but inline so this
          card doesn't have to live inside the lv2-root scope. */}
      <span
        aria-hidden
        className="cf-shimmer-bar pointer-events-none absolute inset-0 -translate-x-[120%]"
        style={{
          background:
            'linear-gradient(115deg, transparent 30%, rgba(214,255,62,0.42) 50%, transparent 70%)',
        }}
      />
      <span className="relative z-10 inline-flex items-center gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Connect
      </span>
      <style jsx>{`
        .cf-shimmer-btn:hover .cf-shimmer-bar {
          transform: translateX(120%);
          transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .cf-shimmer-btn .cf-shimmer-bar {
          transition: transform 0s;
        }
      `}</style>
    </button>
  )
}

export type { ServiceCardProps }
