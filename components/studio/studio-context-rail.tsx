import { getActiveBrandVoice } from '@/lib/brand-voice/get-active-brand-voice'
import { getBrandKit } from '@/lib/brand-kit/get-brand-kit'
import { VoicePill } from '@/components/studio/voice-pill'
import { KitPill } from '@/components/studio/kit-pill'

interface StudioContextRailProps {
  workspaceId: string
}

/**
 * Rail of "Voice" + "Kit" pill-cards that sits above the generation form.
 *
 * The whole point of this surface is that brand voice and brand kit get
 * applied silently to every AI generation — without a visible context
 * users have no way to know what's being applied or to swap it before
 * they hit Generate. Putting both pills in the flow lets them edit
 * inline (drawer) and see the change reflected on the card before they
 * submit.
 */
export async function StudioContextRail({ workspaceId }: StudioContextRailProps) {
  const [voice, kit] = await Promise.all([
    getActiveBrandVoice(workspaceId),
    getBrandKit(workspaceId),
  ])

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="text-primary">·</span> Studio context
        </p>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
          applied on every generation
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <VoicePill workspaceId={workspaceId} voice={voice} />
        <KitPill workspaceId={workspaceId} kit={kit} />
      </div>
    </section>
  )
}
