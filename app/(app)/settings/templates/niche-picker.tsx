'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'

import { setActiveNicheAction } from './actions'
import { NICHE_PRESETS, type NicheId } from '@/lib/niche/presets'

interface NichePickerProps {
  workspaceId: string
  initialNiche: NicheId | null
}

/**
 * Radio-style niche picker with optimistic UI. Clicking a card fires
 * the server action; the card flips into a "saved" confirmation
 * inline so the user doesn't need a separate save button.
 */
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
        // Revalidate so other server-rendered surfaces pick up the new niche.
        router.refresh()
        setTimeout(() => setSavedAt(null), 2500)
      } else if (result.ok === false) {
        setError(result.error)
      }
    })
  }

  const presetEntries = Object.values(NICHE_PRESETS)

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Niche presets
        </h2>
        <div className="flex items-center gap-2">
          {savedAt ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <Check className="h-3 w-3" />
              {savedAt === 'Cleared' ? 'Cleared' : `${savedAt} active`}
            </span>
          ) : null}
          {selected !== null ? (
            <button
              type="button"
              onClick={() => choose('')}
              disabled={isPending}
              className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              Clear selection
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {presetEntries.map((n) => {
          const isActive = selected === n.id
          const isLoading = pendingId === n.id && isPending

          return (
            <button
              key={n.id}
              type="button"
              onClick={() => choose(n.id)}
              disabled={isPending}
              className="flex items-start gap-3 rounded-md p-3 text-left transition-all hover:-translate-y-0.5 disabled:opacity-80"
              style={{
                background: isActive ? 'var(--lv2d-primary, #2A1A3D)' : 'var(--lv2d-bg-2, rgba(0,0,0,.02))',
                color: isActive ? '#D6FF3E' : undefined,
                border: `1px solid ${isActive ? 'var(--lv2d-primary, #2A1A3D)' : 'var(--lv2d-border, rgba(0,0,0,.1))'}`,
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                style={{
                  background: isActive ? 'rgba(214,255,62,.15)' : 'var(--lv2d-card, white)',
                }}
                aria-hidden
              >
                {n.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium ${isActive ? 'text-[#D6FF3E]' : ''}`}>
                    {n.name}
                  </p>
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : isActive ? (
                    <Check className="h-4 w-4 shrink-0 text-[#D6FF3E]" strokeWidth={3} />
                  ) : null}
                </div>
                <p
                  className="mt-0.5 text-xs"
                  style={{
                    color: isActive ? 'rgba(214,255,62,.65)' : 'var(--lv2d-muted, #7c7468)',
                  }}
                >
                  {n.description}
                </p>
                <p
                  className="mt-1.5 text-[11px] leading-relaxed"
                  style={{
                    color: isActive
                      ? 'rgba(255,255,255,.8)'
                      : 'var(--lv2d-muted, #7c7468)',
                  }}
                >
                  <span
                    className="font-mono font-bold uppercase tracking-wider"
                    style={{
                      color: isActive
                        ? 'rgba(214,255,62,.6)'
                        : 'var(--lv2d-muted, #7c7468)',
                    }}
                  >
                    Tone:
                  </span>{' '}
                  {n.tone}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        Applied on top of each platform template at generation time. Changes apply to new drafts
        immediately — use bulk-regenerate to refresh existing drafts.
      </p>
    </section>
  )
}
