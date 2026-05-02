'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState } from 'react-dom'
import { Loader2, Sparkles, Wand2 } from 'lucide-react'

import {
  listZapcapTemplatesAction,
  renderCaptionsAction,
  type ListZapcapTemplatesState,
  type RenderCaptionsState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/highlights/captions-actions'
import type { CaptionRenderRow } from '@/lib/captions/list-caption-renders'
import type { ZapCapTemplate } from '@/lib/captions/zapcap-client'

interface CaptionRenderPanelProps {
  workspaceId: string
  highlightId: string
  /** All caption renders for this highlight, latest-first. */
  renders: CaptionRenderRow[]
}

/**
 * Per-highlight panel for the ZapCap animated-captions pipeline.
 * Visible only on highlights with `status='ready'` (the underlying
 * Shotstack render must finish before ZapCap can pull from its URL).
 *
 * Three states:
 *   - empty            — show the "Add animated captions" CTA
 *   - in-flight        — show a queued/processing badge + spinner
 *   - has finished MP4 — show a play link to ZapCap's CDN
 *
 * The picker fetches the user's ZapCap templates on-demand (account-
 * scoped, no static catalogue).
 */
export function CaptionRenderPanel({
  workspaceId,
  highlightId,
  renders,
}: CaptionRenderPanelProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [templates, setTemplates] = useState<ZapCapTemplate[] | null>(null)

  const [listState, listAction] = useFormState<ListZapcapTemplatesState, FormData>(
    listZapcapTemplatesAction,
    {},
  )
  const [renderState, renderAction] = useFormState<RenderCaptionsState, FormData>(
    renderCaptionsAction,
    {},
  )

  // Track whether the templates have already been requested for this
  // panel so re-opens don't fire a redundant API call within ~30s.
  const lastFetchRef = useRef<number>(0)

  // When the picker opens for the first time (or after 30s), trigger
  // a fetch via a hidden form submission. Result lands in listState.
  useEffect(() => {
    if (!pickerOpen) return
    const now = Date.now()
    if (templates && now - lastFetchRef.current < 30_000) return

    const fd = new FormData()
    fd.set('workspace_id', workspaceId)
    listAction(fd)
    lastFetchRef.current = now
  }, [pickerOpen, templates, listAction, workspaceId])

  useEffect(() => {
    if (listState.ok) setTemplates(listState.templates)
  }, [listState])

  // Soft refresh the parent route when a render completes so the
  // server-rendered render list updates. The action revalidates the
  // path on submit; the live status row updates via Supabase RLS-
  // safe polling below.
  const ready = renders.find((r) => r.status === 'ready')
  const inFlight = renders.find(
    (r) => r.status === 'queued' || r.status === 'processing',
  )

  // While a render is in flight, ping the server every 5s so the
  // server-rendered `renders` prop refreshes without a full hard
  // reload. Realtime subscription is a P2 polish.
  const router = useRouter()
  useEffect(() => {
    if (!inFlight) return
    const id = setInterval(() => router.refresh(), 5_000)
    return () => clearInterval(id)
  }, [inFlight, router])

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Wand2 className="h-3.5 w-3.5 text-primary/70" />
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Animated captions
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/70">
          ZapCap · BYOK
        </span>
      </div>

      {/* Existing render — link to the captioned MP4 */}
      {ready && ready.output_url ? (
        <div className="mt-2 flex items-center gap-2">
          <a
            href={ready.output_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-700 hover:bg-emerald-100"
          >
            <Sparkles className="h-3 w-3" />
            Captioned MP4
          </a>
          <span className="text-[10px] font-mono text-muted-foreground">
            {ready.template_id.slice(0, 8)}…
          </span>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="ml-auto text-[11px] font-semibold text-primary/80 underline-offset-2 hover:underline"
          >
            Try another style
          </button>
        </div>
      ) : null}

      {/* In-flight indicator */}
      {!ready && inFlight ? (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
          <Loader2 className="h-3 w-3 animate-spin" />
          {inFlight.status === 'queued' ? 'Queued…' : 'Rendering…'}
        </div>
      ) : null}

      {/* CTA when nothing is in flight and nothing is ready */}
      {!ready && !inFlight ? (
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1 text-[12px] font-bold text-foreground hover:bg-muted/60"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Add animated captions
        </button>
      ) : null}

      {/* Failure */}
      {renders.find((r) => r.status === 'failed') ? (
        <p className="mt-2 text-[11px] text-rose-700">
          {renders.find((r) => r.status === 'failed')?.error ??
            'A previous render failed. Try a different style.'}
        </p>
      ) : null}

      {/* Picker dropdown */}
      {pickerOpen ? (
        <div className="mt-3 flex flex-col gap-2">
          {!templates && !listState.ok && !('error' in listState && listState.error) ? (
            <p className="text-[11px] text-muted-foreground">
              Loading your ZapCap templates…
            </p>
          ) : null}

          {'error' in listState && listState.error ? (
            <p className="text-[11px] text-rose-700">{listState.error}</p>
          ) : null}

          {templates && templates.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No templates returned by ZapCap. Add one in the ZapCap
              dashboard, then reopen.
            </p>
          ) : null}

          {templates && templates.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <form key={t.id} action={renderAction}>
                  <input type="hidden" name="workspace_id" value={workspaceId} />
                  <input type="hidden" name="highlight_id" value={highlightId} />
                  <input type="hidden" name="template_id" value={t.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-foreground hover:border-primary/60 hover:bg-primary/[0.04]"
                  >
                    {t.name}
                  </button>
                </form>
              ))}
            </div>
          ) : null}

          {'error' in renderState && renderState.error ? (
            <p className="text-[11px] text-rose-700">{renderState.error}</p>
          ) : null}
          {renderState.ok ? (
            <p className="text-[11px] text-emerald-700">
              Render queued. Status will update when ZapCap finishes.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

