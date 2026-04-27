import Link from 'next/link'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Inbox,
  Layers,
  MessageSquare,
  Plug,
  Send,
  Star,
  TrendingDown,
  TrendingUp,
  Users2,
  Video,
  Wand2,
  Zap,
} from 'lucide-react'

import { Sparkline } from '@/components/dashboard/sparkline'
import { SmartSuggestions } from '@/components/dashboard/smart-suggestions'
import { SetupChecklist } from '@/components/dashboard/setup-checklist'
import { BrandLogo } from '@/components/ai-keys/brand-logo'
import type { AiProvider } from '@/lib/ai/providers/types'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspaceUsage } from '@/lib/billing/get-usage'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS, checkPlanAccess } from '@/lib/billing/plans'
import { getWorkspaceStats } from '@/lib/dashboard/get-workspace-stats'
import { getSuggestions } from '@/lib/suggestions/get-suggestions'
import { getActiveBrandVoice } from '@/lib/brand-voice/get-active-brand-voice'
import { getScheduledOutputs } from '@/lib/schedule/get-scheduled-outputs'
import { createClient } from '@/lib/supabase/server'
import { PLATFORM_LABELS, PLATFORM_LONG_LABELS } from '@/lib/platforms'
import type { OutputPlatform } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

// ── Local style block — scopes the plum/chartreuse landing palette to
// the dashboard via `.lv2-dash` so the rest of the app keeps its violet.
const DASH_STYLES = `
.lv2-dash {
  --lv2d-bg: #FAF7F2; --lv2d-bg-2: #F3EDE3; --lv2d-fg: #181511;
  --lv2d-fg-soft: #3a342c; --lv2d-muted: #7c7468; --lv2d-muted-2: #ECE5D8;
  --lv2d-border: #E5DDCE; --lv2d-border-strong: #CFC4AF; --lv2d-card: #FFFDF8;
  --lv2d-primary: #2A1A3D; --lv2d-primary-ink: #120920; --lv2d-primary-soft: #EDE6F5;
  --lv2d-accent: #D6FF3E; --lv2d-accent-ink: #1a2000;
  --lv2d-success: #0F6B4D; --lv2d-success-soft: #E6F4EE;
  --lv2d-warn: #A0530B; --lv2d-warn-soft: #FBEDD9;
  --lv2d-danger: #9B2018;
  background-color: var(--lv2d-bg);
  background-image: radial-gradient(circle at 2px 2px, rgba(120,90,40,.04) 1px, transparent 0);
  background-size: 24px 24px;
  color: var(--lv2d-fg);
  min-height: 100%;
}
.lv2-dash .lv2d-display { font-family: var(--font-instrument-serif), serif; letter-spacing: -.01em; font-weight: 400; }
.lv2-dash .lv2d-sans-d { font-family: var(--font-inter-tight), sans-serif; letter-spacing: -.02em; }
.lv2-dash .lv2d-mono { font-family: var(--font-jetbrains-mono), monospace; }
.lv2-dash .lv2d-tabular { font-variant-numeric: tabular-nums; }
.lv2-dash .lv2d-mono-label {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-inter-tight), var(--font-inter), system-ui, sans-serif;
  font-size: 10.5px; font-weight: 700;
  letter-spacing: .22em; text-transform: uppercase;
  color: color-mix(in srgb, var(--lv2d-primary) 78%, transparent);
}
.lv2-dash .lv2d-mono-label::before {
  content: ''; display: inline-block; height: 1px; width: 18px;
  background: color-mix(in srgb, var(--lv2d-primary) 38%, transparent);
}
.lv2-dash .lv2d-card {
  position: relative;
  background: var(--lv2d-card); border: 1px solid var(--lv2d-border);
  border-radius: 16px;
  overflow: hidden;
}
.lv2-dash .lv2d-card::after {
  content: ''; position: absolute; left: 1.25rem; right: 1.25rem; top: 0; height: 1px;
  background: linear-gradient(to right,
    transparent,
    color-mix(in srgb, var(--lv2d-primary) 28%, transparent),
    transparent);
  pointer-events: none;
}
.lv2-dash .lv2d-ring-soft {
  box-shadow:
    0 1px 0 rgba(255,255,255,.55) inset,
    0 1px 2px rgba(24,21,17,.03),
    0 14px 32px -22px rgba(42,26,61,.22);
}
.lv2-dash .lv2d-chip {
  display: inline-flex; align-items: center; gap: .25rem;
  border-radius: 999px; padding: 2px 8px;
  font-size: 10px; font-weight: 700; letter-spacing: .01em;
}
/* ─── Dashboard buttons — same 3D-physical recipe as PremiumButton.
   One language across Settings / AI keys / Integrations / Dashboard
   so every button reacts consistently: lit-from-above, multi-layer
   drop shadow, lift on hover, press-down on active, chartreuse halo
   ring on the primary/accent variants. */
.lv2-dash .lv2d-btn-primary,
.lv2-dash .lv2d-btn-accent,
.lv2-dash .lv2d-btn-ghost {
  position: relative;
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  padding: 0 16px; height: 38px;
  border-radius: 10px;
  font-family: var(--font-inter-tight), var(--font-inter), system-ui, sans-serif;
  font-weight: 700; font-size: 13px; letter-spacing: -.005em;
  transition: box-shadow .18s ease, transform .18s ease, filter .18s ease;
  isolation: isolate;
}

/* Small variants — same physical recipe at a tighter footprint, used
   for inline section-header CTAs ("Open analytics →", "Tune →", etc.)
   so every clickable thing in the dashboard speaks the same language. */
.lv2-dash .lv2d-btn-primary-sm,
.lv2-dash .lv2d-btn-accent-sm,
.lv2-dash .lv2d-btn-ghost-sm {
  position: relative;
  display: inline-flex; align-items: center; justify-content: center; gap: .35rem;
  padding: 0 10px; height: 26px;
  border-radius: 8px;
  font-family: var(--font-inter-tight), var(--font-inter), system-ui, sans-serif;
  font-weight: 700; font-size: 11px; letter-spacing: -.002em;
  transition: box-shadow .18s ease, transform .18s ease, filter .18s ease;
  isolation: isolate;
  white-space: nowrap;
}
.lv2-dash .lv2d-btn-pill-sm {
  position: relative;
  display: inline-flex; align-items: center; justify-content: center; gap: .25rem;
  padding: 0 10px; height: 28px;
  border-radius: 999px;
  font-family: var(--font-inter-tight), var(--font-inter), system-ui, sans-serif;
  font-weight: 800; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase;
  transition: box-shadow .18s ease, transform .18s ease, filter .18s ease;
  isolation: isolate;
  background: linear-gradient(180deg, #2A1A3D 0%, #120920 100%);
  color: var(--lv2d-accent);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.18),
    inset 0 -1px 0 rgba(0,0,0,.55),
    inset 0 -3px 6px -2px rgba(0,0,0,.4),
    0 1px 1px rgba(18,9,32,.45),
    0 4px 8px -2px rgba(18,9,32,.45),
    0 12px 22px -10px rgba(18,9,32,.35);
}
.lv2-dash .lv2d-btn-pill-sm:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.24),
    inset 0 -1px 0 rgba(0,0,0,.55),
    inset 0 -3px 6px -2px rgba(0,0,0,.4),
    0 1px 1px rgba(18,9,32,.50),
    0 8px 14px -2px rgba(18,9,32,.50),
    0 18px 30px -10px rgba(18,9,32,.45),
    0 0 0 3px rgba(214,255,62,.10),
    0 0 22px -2px rgba(214,255,62,.30);
}
.lv2-dash .lv2d-btn-pill-sm:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.10),
    inset 0 -1px 0 rgba(0,0,0,.45),
    inset 0 2px 4px rgba(0,0,0,.45),
    0 1px 1px rgba(18,9,32,.30);
  transition: box-shadow .05s ease, transform .05s ease;
}

.lv2-dash .lv2d-btn-primary-sm {
  background: linear-gradient(180deg, #2A1A3D 0%, #120920 100%);
  color: var(--lv2d-accent);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.18),
    inset 0 -1px 0 rgba(0,0,0,.55),
    inset 0 -3px 6px -2px rgba(0,0,0,.4),
    0 1px 1px rgba(18,9,32,.45),
    0 3px 6px -2px rgba(18,9,32,.45),
    0 10px 20px -10px rgba(18,9,32,.35);
}
.lv2-dash .lv2d-btn-primary-sm:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.24),
    inset 0 -1px 0 rgba(0,0,0,.55),
    inset 0 -3px 6px -2px rgba(0,0,0,.4),
    0 1px 1px rgba(18,9,32,.50),
    0 6px 10px -2px rgba(18,9,32,.50),
    0 16px 28px -10px rgba(18,9,32,.45),
    0 0 0 3px rgba(214,255,62,.10),
    0 0 22px -2px rgba(214,255,62,.30);
}
.lv2-dash .lv2d-btn-accent-sm {
  background: linear-gradient(180deg, #E5FF6A 0%, #BFE82C 100%);
  color: var(--lv2d-accent-ink);
  font-weight: 800;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.55),
    inset 0 -1px 0 rgba(74,90,0,.45),
    inset 0 -3px 6px -2px rgba(74,90,0,.30),
    0 1px 1px rgba(74,90,0,.30),
    0 3px 6px -2px rgba(74,90,0,.35),
    0 10px 20px -10px rgba(74,90,0,.35);
}
.lv2-dash .lv2d-btn-accent-sm:hover {
  transform: translateY(-1px);
  filter: brightness(1.03);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.65),
    inset 0 -1px 0 rgba(74,90,0,.45),
    inset 0 -3px 6px -2px rgba(74,90,0,.30),
    0 1px 1px rgba(74,90,0,.35),
    0 6px 10px -2px rgba(74,90,0,.40),
    0 16px 28px -10px rgba(74,90,0,.40),
    0 0 0 3px rgba(214,255,62,.30),
    0 0 22px -2px rgba(214,255,62,.50);
}
.lv2-dash .lv2d-btn-ghost-sm {
  background: linear-gradient(180deg, #FFFDF8 0%, #F1ECDF 100%);
  color: var(--lv2d-fg);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.95),
    inset 0 -1px 0 rgba(24,21,17,.10),
    inset 0 -3px 6px -2px rgba(24,21,17,.06),
    0 0 0 1px var(--lv2d-border),
    0 1px 1px rgba(24,21,17,.06),
    0 3px 6px -2px rgba(24,21,17,.10),
    0 10px 20px -10px rgba(24,21,17,.10);
}
.lv2-dash .lv2d-btn-ghost-sm:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,1),
    inset 0 -1px 0 rgba(24,21,17,.10),
    inset 0 -3px 6px -2px rgba(24,21,17,.06),
    0 0 0 1px var(--lv2d-border-strong),
    0 1px 1px rgba(24,21,17,.08),
    0 6px 10px -2px rgba(24,21,17,.14),
    0 14px 26px -10px rgba(24,21,17,.14),
    0 0 0 3px rgba(42,26,61,.05);
}
.lv2-dash .lv2d-btn-primary-sm:active,
.lv2-dash .lv2d-btn-accent-sm:active,
.lv2-dash .lv2d-btn-ghost-sm:active {
  transform: translateY(1px);
  transition: box-shadow .05s ease, transform .05s ease, filter .05s ease;
}
.lv2-dash .lv2d-btn-primary-sm:active {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.10),
    inset 0 -1px 0 rgba(0,0,0,.45),
    inset 0 2px 4px rgba(0,0,0,.45),
    0 1px 1px rgba(18,9,32,.30);
}
.lv2-dash .lv2d-btn-accent-sm:active {
  filter: brightness(.97);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.30),
    inset 0 -1px 0 rgba(74,90,0,.35),
    inset 0 2px 4px rgba(74,90,0,.35),
    0 1px 1px rgba(74,90,0,.20);
}
.lv2-dash .lv2d-btn-ghost-sm:active {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.55),
    inset 0 -1px 0 rgba(24,21,17,.08),
    inset 0 2px 4px rgba(24,21,17,.08),
    0 0 0 1px var(--lv2d-border-strong),
    0 1px 1px rgba(24,21,17,.04);
}
.lv2-dash .lv2d-btn-primary-sm::before,
.lv2-dash .lv2d-btn-accent-sm::before,
.lv2-dash .lv2d-btn-ghost-sm::before,
.lv2-dash .lv2d-btn-pill-sm::before {
  content: '';
  position: absolute; inset: 0; border-radius: inherit;
  pointer-events: none;
}
.lv2-dash .lv2d-btn-primary-sm::before,
.lv2-dash .lv2d-btn-pill-sm::before {
  background: radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,.18) 0%, transparent 55%);
}
.lv2-dash .lv2d-btn-accent-sm::before {
  background: radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,.55) 0%, transparent 55%);
}
.lv2-dash .lv2d-btn-ghost-sm::before {
  background: radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,.85) 0%, transparent 55%);
}
@media (prefers-reduced-motion: reduce) {
  .lv2-dash .lv2d-btn-primary-sm,
  .lv2-dash .lv2d-btn-accent-sm,
  .lv2-dash .lv2d-btn-ghost-sm,
  .lv2-dash .lv2d-btn-pill-sm { transition: none; }
  .lv2-dash .lv2d-btn-primary-sm:hover,
  .lv2-dash .lv2d-btn-accent-sm:hover,
  .lv2-dash .lv2d-btn-ghost-sm:hover,
  .lv2-dash .lv2d-btn-pill-sm:hover { transform: none; }
}

/* Primary — plum gradient with chartreuse text. */
.lv2-dash .lv2d-btn-primary {
  background: linear-gradient(180deg, #2A1A3D 0%, #120920 100%);
  color: var(--lv2d-accent);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.18),
    inset 0 -1px 0 rgba(0,0,0,.55),
    inset 0 -3px 6px -2px rgba(0,0,0,.4),
    0 1px 1px rgba(18,9,32,.45),
    0 4px 8px -2px rgba(18,9,32,.45),
    0 14px 28px -10px rgba(18,9,32,.35);
}
.lv2-dash .lv2d-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.24),
    inset 0 -1px 0 rgba(0,0,0,.55),
    inset 0 -3px 6px -2px rgba(0,0,0,.4),
    0 1px 1px rgba(18,9,32,.50),
    0 8px 14px -2px rgba(18,9,32,.50),
    0 22px 38px -10px rgba(18,9,32,.45),
    0 0 0 4px rgba(214,255,62,.10),
    0 0 28px -2px rgba(214,255,62,.30);
}

/* Accent — chartreuse on dark plum text. The "Upgrade / Save"
   variant. Brighter rest state, thicker halo on hover. */
.lv2-dash .lv2d-btn-accent {
  background: linear-gradient(180deg, #E5FF6A 0%, #BFE82C 100%);
  color: var(--lv2d-accent-ink);
  font-weight: 800;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.55),
    inset 0 -1px 0 rgba(74,90,0,.45),
    inset 0 -3px 6px -2px rgba(74,90,0,.30),
    0 1px 1px rgba(74,90,0,.30),
    0 4px 8px -2px rgba(74,90,0,.35),
    0 14px 28px -10px rgba(74,90,0,.35);
}
.lv2-dash .lv2d-btn-accent:hover {
  transform: translateY(-1px);
  filter: brightness(1.03);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.65),
    inset 0 -1px 0 rgba(74,90,0,.45),
    inset 0 -3px 6px -2px rgba(74,90,0,.30),
    0 1px 1px rgba(74,90,0,.35),
    0 8px 14px -2px rgba(74,90,0,.40),
    0 22px 38px -10px rgba(74,90,0,.40),
    0 0 0 4px rgba(214,255,62,.30),
    0 0 28px -2px rgba(214,255,62,.50);
}

/* Ghost — paper-on-cream outline. Subtle plum halo on hover. */
.lv2-dash .lv2d-btn-ghost {
  background: linear-gradient(180deg, #FFFDF8 0%, #F1ECDF 100%);
  color: var(--lv2d-fg);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.95),
    inset 0 -1px 0 rgba(24,21,17,.10),
    inset 0 -3px 6px -2px rgba(24,21,17,.06),
    0 0 0 1px var(--lv2d-border),
    0 1px 1px rgba(24,21,17,.06),
    0 4px 8px -2px rgba(24,21,17,.10),
    0 12px 24px -10px rgba(24,21,17,.10);
}
.lv2-dash .lv2d-btn-ghost:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,1),
    inset 0 -1px 0 rgba(24,21,17,.10),
    inset 0 -3px 6px -2px rgba(24,21,17,.06),
    0 0 0 1px var(--lv2d-border-strong),
    0 1px 1px rgba(24,21,17,.08),
    0 8px 14px -2px rgba(24,21,17,.14),
    0 18px 32px -10px rgba(24,21,17,.14),
    0 0 0 4px rgba(42,26,61,.05);
}

/* Press-down — same family for all three variants. The lift
   collapses, an inner press-shadow appears at the top, ambient
   halo shrinks. The committed click feels earned. */
.lv2-dash .lv2d-btn-primary:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.10),
    inset 0 -1px 0 rgba(0,0,0,.45),
    inset 0 2px 4px rgba(0,0,0,.45),
    0 1px 1px rgba(18,9,32,.30),
    0 2px 4px -1px rgba(18,9,32,.30);
  transition: box-shadow .05s ease, transform .05s ease;
}
.lv2-dash .lv2d-btn-accent:active {
  transform: translateY(1px);
  filter: brightness(.97);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.30),
    inset 0 -1px 0 rgba(74,90,0,.35),
    inset 0 2px 4px rgba(74,90,0,.35),
    0 1px 1px rgba(74,90,0,.20),
    0 2px 4px -1px rgba(74,90,0,.20);
  transition: box-shadow .05s ease, transform .05s ease, filter .05s ease;
}
.lv2-dash .lv2d-btn-ghost:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.55),
    inset 0 -1px 0 rgba(24,21,17,.08),
    inset 0 2px 4px rgba(24,21,17,.08),
    0 0 0 1px var(--lv2d-border-strong),
    0 1px 1px rgba(24,21,17,.04);
  transition: box-shadow .05s ease, transform .05s ease;
}

/* Static specular bloom — radial white at the top so each variant
   reads as lit-from-above. Implemented as a ::before pseudo so we
   don't have to wrap every button in extra markup. */
.lv2-dash .lv2d-btn-primary::before,
.lv2-dash .lv2d-btn-accent::before,
.lv2-dash .lv2d-btn-ghost::before {
  content: '';
  position: absolute; inset: 0; border-radius: inherit;
  pointer-events: none;
}
.lv2-dash .lv2d-btn-primary::before {
  background: radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,.18) 0%, transparent 55%);
}
.lv2-dash .lv2d-btn-accent::before {
  background: radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,.55) 0%, transparent 55%);
}
.lv2-dash .lv2d-btn-ghost::before {
  background: radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,.85) 0%, transparent 55%);
}

@media (prefers-reduced-motion: reduce) {
  .lv2-dash .lv2d-btn-primary,
  .lv2-dash .lv2d-btn-accent,
  .lv2-dash .lv2d-btn-ghost {
    transition: none;
  }
  .lv2-dash .lv2d-btn-primary:hover,
  .lv2-dash .lv2d-btn-accent:hover,
  .lv2-dash .lv2d-btn-ghost:hover {
    transform: none;
  }
}
.lv2-dash .lv2d-step-line {
  position: relative;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--lv2d-border-strong) 100%, transparent) 0%,
    color-mix(in srgb, var(--lv2d-primary) 30%, transparent) 100%
  );
  overflow: hidden;
}
.lv2-dash .lv2d-step-line::after {
  content: '';
  position: absolute; top: 0; left: -40%;
  width: 40%; height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(214, 255, 62, 0.85) 50%,
    transparent 100%
  );
  animation: lv2d-step-flow 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes lv2d-step-flow {
  0%   { transform: translateX(0%); }
  100% { transform: translateX(350%); }
}
@media (prefers-reduced-motion: reduce) {
  .lv2-dash .lv2d-step-line::after { animation: none; opacity: 0; }
}
.lv2-dash .lv2d-funnel-step {
  position: relative; z-index: 10;
  border-radius: 12px; border: 1px solid var(--lv2d-border);
  background: var(--lv2d-card); padding: 12px;
  text-align: left; width: 100%;
  transition: transform .18s, border-color .18s, box-shadow .18s;
}
.lv2-dash .lv2d-funnel-step:hover {
  transform: translateY(-2px); border-color: var(--lv2d-border-strong);
  box-shadow: 0 10px 24px -16px rgba(42,26,61,.22);
}
/* Active funnel step — the bucket that needs user action. Outline alone
   reads as "focused", not "attention here". A warm plum wash + lime
   halo gives it the visual weight it deserves. */
.lv2-dash .lv2d-funnel-cta {
  outline: 2px solid var(--lv2d-primary);
  outline-offset: 2px;
  background: linear-gradient(180deg, var(--lv2d-primary-soft) 0%, var(--lv2d-card) 70%);
  box-shadow:
    0 10px 28px -16px rgba(42,26,61,.28),
    0 0 0 4px rgba(214,255,62,.14);
}
.lv2-dash .lv2d-funnel-cta:hover {
  box-shadow:
    0 18px 40px -20px rgba(42,26,61,.32),
    0 0 0 4px rgba(214,255,62,.22);
}
@keyframes lv2d-pulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
.lv2-dash .lv2d-pulse { animation: lv2d-pulse 2.4s ease-in-out infinite; }
@keyframes lv2d-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.lv2-dash .lv2d-shimmer-wrap { position: relative; overflow: hidden; }
.lv2-dash .lv2d-shimmer-bar {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(214,255,62,.7), transparent);
  animation: lv2d-shimmer 2.2s linear infinite;
}
@property --lv2d-beam-angle {
  syntax: '<angle>'; initial-value: 0deg; inherits: false;
}
@keyframes lv2d-beam-spin { to { --lv2d-beam-angle: 360deg; } }
.lv2-dash .lv2d-beam { position: relative; isolation: isolate; }
.lv2-dash .lv2d-beam::before {
  content: ''; position: absolute; inset: -1.5px; border-radius: inherit; padding: 1.5px;
  background: conic-gradient(
    from var(--lv2d-beam-angle),
    transparent 0deg, transparent 210deg,
    rgba(214,255,62,0.0) 240deg, rgba(214,255,62,0.9) 268deg,
    #FFFFFF 275deg, rgba(214,255,62,0.9) 282deg,
    rgba(214,255,62,0.0) 310deg, transparent 360deg
  );
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude; -webkit-mask-composite: xor;
  animation: lv2d-beam-spin 4.5s linear infinite;
  pointer-events: none; z-index: 3;
  filter: drop-shadow(0 0 6px rgba(214,255,62,0.55));
}
@keyframes lv2d-fadeup {
  from { opacity: 0; transform: translateY(8px); filter: blur(6px); }
  to   { opacity: 1; transform: translateY(0);   filter: blur(0); }
}
.lv2-dash .lv2d-enter { animation: lv2d-fadeup .55s cubic-bezier(.2,.8,.2,1) both; }
.lv2-dash .lv2d-enter-d1 { animation-delay: .06s; }
.lv2-dash .lv2d-enter-d2 { animation-delay: .12s; }
.lv2-dash .lv2d-enter-d3 { animation-delay: .18s; }
.lv2-dash .lv2d-card-lift { transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s, border-color .25s; }
.lv2-dash .lv2d-card-lift:hover {
  transform: translateY(-3px);
  border-color: var(--lv2d-border-strong);
  box-shadow: 0 1px 0 rgba(24,21,17,.04), 0 24px 40px -24px rgba(42,26,61,.25);
}
@media (prefers-reduced-motion: reduce) {
  .lv2-dash .lv2d-beam::before,
  .lv2-dash .lv2d-enter,
  .lv2-dash .lv2d-card-lift { animation: none !important; transition: none !important; }
}
.lv2-dash .lv2d-thumb {
  position: relative;
  border-radius: 8px;
  background:
    radial-gradient(circle at 28% 35%, rgba(214,255,62,0.18) 0%, transparent 45%),
    radial-gradient(circle at 75% 65%, rgba(75,15,184,0.32) 0%, transparent 50%),
    linear-gradient(135deg, #2A1A3D 0%, #120920 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.30),
    0 1px 2px rgba(42,26,61,0.18);
  overflow: hidden;
}
.lv2-dash .lv2d-thumb::after {
  content: '';
  position: absolute; inset: 0;
  background-image:
    radial-gradient(circle at 1px 1px, rgba(255,255,255,0.10) 0.5px, transparent 0);
  background-size: 6px 6px;
  opacity: 0.55;
  mix-blend-mode: overlay;
  pointer-events: none;
}
.lv2-dash .lv2d-row-hover { transition: background .15s ease; }
.lv2-dash .lv2d-row-hover:hover { background: rgba(42,26,61,.035); }
.lv2-dash .lv2d-row-hover:hover .lv2d-row-hover-target { opacity: 1; transform: translateX(2px); }
.lv2-dash .lv2d-row-hover-target { transition: opacity .15s ease, transform .15s ease; }
.lv2-dash .lv2d-divide > * + * { border-top: 1px solid var(--lv2d-border); }
@keyframes lv2d-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.lv2-dash .lv2d-fade-in { animation: lv2d-fade-in .3s cubic-bezier(.2,.8,.2,1) both; }
`

/* ── Helpers ──────────────────────────────────────────────────── */

function DeltaChip({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null
  if (previous === 0 && current > 0)
    return (
      <span
        className="lv2d-chip"
        style={{ background: 'var(--lv2d-success-soft)', color: 'var(--lv2d-success)' }}
      >
        <TrendingUp className="h-2.5 w-2.5" />
        New
      </span>
    )
  const delta = current - previous
  if (delta === 0) return null
  const pct = Math.round((delta / previous) * 100)
  const up = delta > 0
  return (
    <span
      className="lv2d-chip"
      style={
        up
          ? { background: 'var(--lv2d-success-soft)', color: 'var(--lv2d-success)' }
          : { background: '#F8E3E0', color: 'var(--lv2d-danger)' }
      }
    >
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {up ? '+' : ''}
      {pct}%
    </span>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.round(h / 24)}d`
}

function relMinutes(rel: string): number {
  if (rel === 'just now') return 0
  const n = parseInt(rel)
  if (rel.endsWith('m')) return n
  if (rel.endsWith('h')) return n * 60
  if (rel.endsWith('d')) return n * 1440
  return 999_999
}

function PlatformDot({ platform }: { platform: OutputPlatform | string }) {
  // Include both the canonical enum values (instagram_reels /
  // youtube_shorts) AND the short aliases (reels / shorts) since both
  // show up in practice — enum values come from outputs.platform,
  // short aliases from UI-layer tag arrays.
  const bg: Record<string, string> = {
    tiktok: '#111',
    instagram: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)',
    instagram_reels: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)',
    reels: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)',
    youtube: '#FF0033',
    youtube_shorts: '#FF0033',
    shorts: '#FF0033',
    linkedin: '#0A66C2',
    x: '#111',
  }
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: bg[platform] ?? '#888' }}
    />
  )
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
  // Unlimited plans get a subtle solid track instead of a fake 33% fill —
  // a half-empty bar on an unlimited plan reads as "progress toward a cap"
  // which is exactly the opposite of what we want to communicate.
  if (limit === -1) {
    return (
      <div
        className="h-1.5 w-full rounded-full"
        style={{ background: 'var(--lv2d-primary-soft)' }}
      />
    )
  }
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const bar =
    pct >= 90 ? 'var(--lv2d-danger)' : pct >= 70 ? 'var(--lv2d-warn)' : 'var(--lv2d-primary)'
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full"
      style={{ background: 'var(--lv2d-muted-2)' }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: bar,
          transition: 'width .9s cubic-bezier(.2,.8,.2,1)',
        }}
      />
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────── */

async function DashboardBody() {
  const [user, workspaces] = await Promise.all([getUser(), getWorkspaces()])
  const firstName =
    ((typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ??
      user?.email ??
      'there')
      .split(/[\s@]/)[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const workspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  // Every per-workspace query runs in a single parallel batch so the page
  // waits on the slowest one, not the sum. `recentOutputs` used to hang
  // off a sequential second round-trip — fold it in here.
  const recentOutputsQuery = async () => {
    if (!workspace) return []
    const supabase = await createClient()
    const { data } = await supabase
      .from('outputs')
      .select('id, platform, current_state, created_at, content_items(title)')
      .eq('workspace_id', workspace.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5)
    return (data ?? []).map((o) => ({
      id: o.id,
      title:
        (o.content_items as unknown as { title: string | null } | null)?.title ?? 'Untitled',
      platform: o.platform,
      state: o.current_state ?? 'draft',
      created_at: o.created_at,
    }))
  }

  const [aiKeys, stats, usage, plan, suggestions, brandVoice, scheduled, recentOutputs] =
    workspace && user
      ? await Promise.all([
          getAiKeys(workspace.id),
          getWorkspaceStats(workspace.id),
          getWorkspaceUsage(workspace.id),
          getWorkspacePlan(workspace.id),
          getSuggestions(workspace.id),
          getActiveBrandVoice(workspace.id),
          getScheduledOutputs(workspace.id),
          recentOutputsQuery(),
        ])
      : [[], null, null, 'free' as const, [], null, [], [] as Array<{
          id: string
          title: string
          platform: string
          state: string
          created_at: string
        }>]

  const planDef = PLANS[plan ?? 'free']
  const hasLlm = aiKeys.some((k) => ['openai', 'anthropic', 'google'].includes(k.provider))
  const showChecklist =
    !hasLlm ||
    (stats?.totalContent ?? 0) === 0 ||
    (stats?.totalOutputs ?? 0) === 0 ||
    (stats?.approvedOutputs ?? 0) === 0
  const pendingReview = stats?.pipelineByState.review ?? 0
  const approved = stats?.pipelineByState.approved ?? 0
  const exported = stats?.pipelineByState.exported ?? 0
  const processing = stats?.recentContent.find((c) => c.status === 'processing')
  const readyContent = stats?.recentContent.find((c) => c.status === 'ready')
  const hasData = (stats?.totalContent ?? 0) > 0

  const isAgencyMode =
    checkPlanAccess(plan ?? 'free', 'multiWorkspace') && workspaces.length > 1
  const otherWorkspaces = workspace
    ? workspaces.filter((w) => w.id !== workspace.id).slice(0, 6)
    : []

  // Brand voice setup-completeness — how many of the three fields
  // (tone, avoid-list, example hook) are filled. We used to render this
  // as a 0-100 "AI quality score" with fake per-metric percentages,
  // which implied live scoring we don't actually do; the card is now
  // an honest "setup X of 3" view with a checklist of fields.
  const bvFields = brandVoice
    ? [
        { label: 'Tone of voice', done: Boolean(brandVoice.tone) },
        { label: 'Words to avoid', done: Boolean(brandVoice.avoid) },
        { label: 'Example hook', done: Boolean(brandVoice.example_hook) },
      ]
    : []
  const bvDoneCount = bvFields.filter((f) => f.done).length
  const bvTotalCount = bvFields.length || 3

  // ── Upcoming Schedule — group scheduled outputs by day label.
  const upcoming = (() => {
    const byDay = new Map<
      string,
      Array<{ time: string; platform: OutputPlatform; title: string }>
    >()
    const now = new Date()
    const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString()
    const tomorrowKey = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString()
    for (const s of scheduled) {
      const d = new Date(s.scheduled_for)
      const key = d.toDateString()
      const dayLabel =
        key === todayKey
          ? 'TODAY'
          : key === tomorrowKey
          ? 'TOMORROW'
          : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
      const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      const items = byDay.get(dayLabel) ?? []
      items.push({
        time,
        platform: s.platform,
        title: s.content_title ?? 'Untitled',
      })
      byDay.set(dayLabel, items)
    }
    return Array.from(byDay.entries()).slice(0, 3).map(([day, items]) => ({
      day,
      items: items.slice(0, 3),
    }))
  })()

  // ── Platform Performance — real post counts from stats.outputsByPlatform,
  // mocked view counts + deltas + sparklines until we wire external analytics.
  const platformPerf = (
    ['tiktok', 'instagram_reels', 'youtube_shorts', 'linkedin'] as OutputPlatform[]
  ).map((key, i) => {
    const posts = stats?.outputsByPlatform?.[key] ?? 0
    const mockViews = [12_400, 8_900, 6_200, 3_700][i]!
    const mockDelta = [18, 11, -4, 7][i]!
    const mockSpark = [
      [4, 6, 5, 8, 10, 9, 12],
      [3, 5, 4, 6, 7, 8, 9],
      [6, 5, 4, 4, 3, 4, 4],
      [2, 3, 3, 4, 5, 4, 5],
    ][i]!
    return {
      key,
      name: PLATFORM_LONG_LABELS[key] ?? key,
      posts,
      views: posts > 0 ? `${(mockViews / 1000).toFixed(1)}K` : '—',
      delta: posts > 0 ? mockDelta : 0,
      spark: mockSpark,
    }
  })

  // ── Team activity — synthesized from real content + output timestamps.
  const activity: Array<{
    who: string
    what: string
    when: string
    color: string
  }> = []
  const whoColors = ['#2A1A3D', '#0A66C2', '#A0530B', '#0F6B4D']
  for (const c of stats?.recentContent.slice(0, 3) ?? []) {
    activity.push({
      who: firstName,
      what: `imported "${c.title ?? 'Untitled'}"`,
      when: formatRelative(c.created_at),
      color: whoColors[0]!,
    })
  }
  for (const o of recentOutputs.slice(0, 2)) {
    activity.push({
      who: 'AI',
      what: `generated a ${PLATFORM_LABELS[o.platform as OutputPlatform] ?? o.platform} draft`,
      when: formatRelative(o.created_at),
      color: whoColors[1]!,
    })
  }
  activity.sort((a, b) => relMinutes(a.when) - relMinutes(b.when))

  // ── Integrations Health — AI providers that can drive generation.
  const integrationRows = [
    { key: 'openai', name: 'OpenAI', sub: 'GPT-4o · drafts + scripts' },
    { key: 'anthropic', name: 'Anthropic', sub: 'Claude · long-form + hooks' },
    { key: 'google', name: 'Google', sub: 'Gemini · low-cost fallback' },
    { key: 'elevenlabs', name: 'ElevenLabs', sub: 'Voice clone · dubbing' },
  ].map((r) => {
    const connected = aiKeys.some((k) => k.provider === r.key)
    return { ...r, ok: connected }
  })
  // "needs attention" only when at least one provider was connected and is
  // now broken. Fresh accounts with nothing connected aren't "broken" —
  // the setup checklist already surfaces that state.
  const integrationsConnected = integrationRows.filter((r) => r.ok).length
  const integrationsNeedAttention =
    integrationsConnected > 0 && integrationRows.some((r) => !r.ok && r.key === 'openai') ? 1 : 0

  const funnel = [
    {
      key: 'import',
      label: 'Imported',
      count: stats?.contentThisMonth ?? 0,
      sub: 'this month',
      tone: { bg: 'var(--lv2d-primary-soft)', fg: 'var(--lv2d-primary)' },
      icon: <Inbox className="h-[15px] w-[15px]" />,
      href: workspace ? `/workspace/${workspace.id}/content/new` : '/dashboard',
    },
    {
      key: 'process',
      label: 'Processing',
      count: processing ? 1 : 0,
      sub: processing ? 'rendering' : 'nothing running',
      tone: { bg: 'var(--lv2d-warn-soft)', fg: 'var(--lv2d-warn)' },
      icon: <Zap className="h-[15px] w-[15px]" />,
      pulse: Boolean(processing),
      href:
        processing && workspace
          ? `/workspace/${workspace.id}/content/${processing.id}`
          : workspace
          ? `/workspace/${workspace.id}`
          : '/dashboard',
    },
    {
      key: 'review',
      label: 'In review',
      count: pendingReview,
      sub: pendingReview > 0 ? 'waiting on you' : 'nothing waiting',
      tone: { bg: 'var(--lv2d-accent)', fg: 'var(--lv2d-accent-ink)' },
      icon: <Check className="h-[15px] w-[15px]" />,
      cta: pendingReview > 0,
      href: workspace ? `/workspace/${workspace.id}/pipeline` : '/dashboard',
    },
    {
      key: 'approved',
      label: 'Approved',
      count: approved,
      sub: approved > 0 ? 'ready to ship' : 'none yet',
      tone: { bg: '#E0EDF7', fg: '#0A66C2' },
      icon: <Calendar className="h-[15px] w-[15px]" />,
      href: workspace ? `/workspace/${workspace.id}/schedule` : '/dashboard',
    },
    {
      key: 'published',
      label: 'Published',
      count: exported,
      sub: 'this month',
      tone: { bg: 'var(--lv2d-success-soft)', fg: 'var(--lv2d-success)' },
      icon: <Send className="h-[15px] w-[15px]" />,
      href: '/analytics',
    },
  ]

  const stateChip: Record<string, { label: string; bg: string; fg: string }> = {
    draft: { label: 'Draft', bg: 'var(--lv2d-muted-2)', fg: 'var(--lv2d-fg-soft)' },
    review: { label: 'Review', bg: 'var(--lv2d-warn-soft)', fg: 'var(--lv2d-warn)' },
    approved: { label: 'Approved', bg: 'var(--lv2d-accent)', fg: 'var(--lv2d-accent-ink)' },
    exported: { label: 'Published', bg: 'var(--lv2d-success-soft)', fg: 'var(--lv2d-success)' },
  }

  return (
    <div className="lv2d-fade-in mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8 2xl:max-w-[1440px]">
          {/* ── Hero ────────────────────────────────────────────── */}
          <header
            className="relative overflow-hidden rounded-3xl border px-5 py-6 sm:px-7 sm:py-7"
            style={{
              background: 'var(--lv2d-card)',
              borderColor: 'var(--lv2d-border)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(24,21,17,.04), 0 22px 44px -28px rgba(42,26,61,.28)',
            }}
          >
            {/* Soft plum glow tucked behind the avatar so the hero
                has real depth without becoming a billboard. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(42,26,61,.16) 0%, rgba(42,26,61,0) 60%)',
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(214,255,62,.18) 0%, rgba(214,255,62,0) 60%)',
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(42,26,61,.32), transparent)',
              }}
            />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                {/* Hero monogram — same designer-grade chip as the
                    Settings hero, in the dashboard's plum so it fits
                    the landing palette instead of jumping to violet. */}
                <span
                  className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[18px] font-bold tracking-tight sm:h-16 sm:w-16 sm:text-[20px]"
                  style={{
                    background:
                      'linear-gradient(140deg, #2A1A3D 0%, #2A1A3D 60%, #120920 100%)',
                    color: 'var(--lv2d-accent)',
                    fontFamily:
                      'var(--font-inter-tight), var(--font-inter), sans-serif',
                    boxShadow:
                      '0 1px 0 rgba(214,255,62,.18) inset, 0 10px 24px -12px rgba(42,26,61,.55)',
                  }}
                  aria-hidden
                >
                  <span
                    className="pointer-events-none absolute inset-1 rounded-[14px]"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,0) 45%)',
                    }}
                  />
                  <span className="relative">
                    {(firstName?.[0] ?? 'C').toUpperCase()}
                  </span>
                </span>

                <div className="min-w-0">
                  <p className="lv2d-mono-label mb-1.5">
                    {new Date().toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {workspace?.name ? ` · ${workspace.name}` : ''}
                  </p>
                  <h1
                    className="lv2d-display lv2d-enter text-[34px] leading-[1.02] sm:text-[40px]"
                    style={{ color: 'var(--lv2d-fg)' }}
                  >
                    {greeting}, {firstName}.
                  </h1>
                  {hasData && stats ? (
                    <p
                      className="lv2d-enter lv2d-enter-d1 mt-2 max-w-xl text-[13.5px] leading-relaxed"
                      style={{ color: 'var(--lv2d-muted)' }}
                    >
                      <b style={{ color: 'var(--lv2d-fg)' }}>
                        {pendingReview} draft{pendingReview === 1 ? '' : 's'}
                      </b>{' '}
                      waiting for review
                      {processing ? (
                        <>
                          {' '}
                          and{' '}
                          <b style={{ color: 'var(--lv2d-fg)' }}>1 clip</b> rendering right now
                        </>
                      ) : null}
                      . Line up your week in about 4 minutes.
                    </p>
                  ) : (
                    <p
                      className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
                      style={{ color: 'var(--lv2d-muted)' }}
                    >
                      No drafts yet. Drop a recording into{' '}
                      <Link
                        href={workspace ? `/workspace/${workspace.id}` : '/'}
                        className="font-semibold underline-offset-4 hover:underline"
                        style={{ color: 'var(--lv2d-fg)' }}
                      >
                        your library
                      </Link>{' '}
                      — first batch lands in about a minute.
                    </p>
                  )}
                </div>
              </div>
              {workspace && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {isAgencyMode && (
                    <Link href="/workspace/new?as=client" className="lv2d-btn-ghost">
                      <Users2 className="h-3.5 w-3.5" /> New client
                    </Link>
                  )}
                  <Link
                    href={`/workspace/${workspace.id}/schedule`}
                    className="lv2d-btn-ghost"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Calendar
                  </Link>
                  <Link
                    href={`/workspace/${workspace.id}/content/new`}
                    className="lv2d-btn-accent"
                  >
                    <span className="text-base leading-none">+</span> New content{' '}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </header>

          {workspace && (
            <>
              {/* ── Clients strip (Agency) ──────────────────────── */}
              {isAgencyMode && otherWorkspaces.length > 0 && (
                <div className="lv2d-card lv2d-ring-soft overflow-hidden">
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid var(--lv2d-border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Users2 className="h-3.5 w-3.5" style={{ color: 'var(--lv2d-primary)' }} />
                      <span className="lv2d-mono-label">Your clients</span>
                      <span
                        className="lv2d-mono lv2d-tabular rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: 'var(--lv2d-muted-2)', color: 'var(--lv2d-muted)' }}
                      >
                        {workspaces.length}
                      </span>
                    </div>
                    <Link href="/workspace/new?as=client" className="lv2d-btn-ghost-sm">
                      Add client <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div
                    className="grid grid-cols-2 gap-px sm:grid-cols-3"
                    style={{ background: 'var(--lv2d-border)' }}
                  >
                    <Link
                      href={`/workspace/${workspace.id}`}
                      className="flex items-center gap-2.5 px-3.5 py-3 transition-colors"
                      style={{ background: 'var(--lv2d-primary-soft)' }}
                    >
                      <div
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: 'var(--lv2d-primary)' }}
                      />
                      <span className="truncate text-xs font-semibold">{workspace.name}</span>
                      <span
                        className="lv2d-mono ml-auto text-[9px] uppercase tracking-wider"
                        style={{ color: 'var(--lv2d-primary)' }}
                      >
                        Now
                      </span>
                    </Link>
                    {otherWorkspaces.map((w) => (
                      <Link
                        key={w.id}
                        href={`/workspace/${w.id}`}
                        className="flex items-center gap-2.5 px-3.5 py-3 transition-colors hover:bg-black/[0.02]"
                        style={{ background: 'var(--lv2d-card)' }}
                      >
                        <div
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: 'var(--lv2d-muted)' }}
                        />
                        <span className="truncate text-xs font-medium">{w.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Setup checklist ─────────────────────────────── */}
              {showChecklist && (
                <SetupChecklist
                  hasAiKey={hasLlm}
                  contentCount={stats?.totalContent ?? 0}
                  outputCount={stats?.totalOutputs ?? 0}
                  hasApprovedOutput={(stats?.approvedOutputs ?? 0) > 0}
                  workspaceId={workspace.id}
                  firstReadyContentId={readyContent?.id}
                />
              )}

              {/* ── Smart Suggestions ───────────────────────────── */}
              {suggestions.length > 0 && <SmartSuggestions suggestions={suggestions} />}

              {/* ── Funnel ──────────────────────────────────────── */}
              {stats && (
                <section className="lv2d-card lv2d-ring-soft overflow-hidden">
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid var(--lv2d-border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="lv2d-mono-label">Your pipeline</span>
                      {hasData && (
                        <span
                          className="lv2d-chip"
                          style={{
                            background: 'var(--lv2d-success-soft)',
                            color: 'var(--lv2d-success)',
                          }}
                        >
                          <span
                            className="lv2d-pulse h-1.5 w-1.5 rounded-full"
                            style={{ background: 'var(--lv2d-success)' }}
                          />{' '}
                          live
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/workspace/${workspace.id}/pipeline`}
                      className="lv2d-btn-ghost-sm"
                    >
                      Open drafts board <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                      {funnel.map((s, i) => (
                        <div key={s.key} className="relative">
                          {i < funnel.length - 1 && (
                            <div className="lv2d-step-line absolute right-[-10px] top-[34px] hidden w-[20px] md:block" />
                          )}
                          <Link
                            href={s.href}
                            className={`lv2d-funnel-step ${s.cta ? 'lv2d-funnel-cta' : ''} block`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.pulse ? 'lv2d-pulse' : ''}`}
                                style={{ background: s.tone.bg, color: s.tone.fg }}
                              >
                                {s.icon}
                              </span>
                              {s.cta && (
                                <span
                                  className="lv2d-chip"
                                  style={{
                                    background: 'var(--lv2d-primary)',
                                    color: 'var(--lv2d-accent)',
                                  }}
                                >
                                  action
                                </span>
                              )}
                            </div>
                            <div className="mt-3 flex items-baseline gap-1.5">
                              <span
                                className="lv2d-sans-d lv2d-tabular text-[30px] font-bold leading-none"
                                style={{
                                  color:
                                    s.count === 0
                                      ? 'var(--lv2d-muted)'
                                      : 'var(--lv2d-fg)',
                                  opacity: s.count === 0 ? 0.55 : 1,
                                }}
                              >
                                {s.count === 0 ? '—' : s.count}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[12px] font-semibold">{s.label}</p>
                            <p className="text-[11px]" style={{ color: 'var(--lv2d-muted)' }}>
                              {s.sub}
                            </p>
                            {s.pulse ? (
                              <div
                                className="lv2d-shimmer-wrap mt-2 h-1 w-full rounded-full"
                                style={{ background: 'var(--lv2d-warn-soft)' }}
                              >
                                <div className="lv2d-shimmer-bar" />
                              </div>
                            ) : (
                              <div
                                className="mt-2 h-1 w-full rounded-full"
                                style={{
                                  background:
                                    s.count === 0
                                      ? 'repeating-linear-gradient(90deg, var(--lv2d-border) 0 4px, transparent 4px 8px)'
                                      : `linear-gradient(90deg, ${s.tone.fg}, transparent)`,
                                  opacity: s.count === 0 ? 0.7 : 0.4,
                                }}
                              />
                            )}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Next Action ─────────────────────────────────── */}
              {processing && (
                <Link
                  href={`/workspace/${workspace.id}/content/${processing.id}`}
                  className="lv2d-card flex items-center gap-4 p-4 transition hover:-translate-y-0.5"
                  style={{ borderColor: 'var(--lv2d-border)' }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: 'var(--lv2d-warn-soft)',
                      color: 'var(--lv2d-warn)',
                    }}
                  >
                    <Clock className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[14px]">
                      &ldquo;{processing.title ?? 'Content'}&rdquo; is processing
                    </p>
                    <p
                      className="mt-0.5 text-[12.5px]"
                      style={{ color: 'var(--lv2d-muted)' }}
                    >
                      Usually takes 1–3 min.
                    </p>
                  </div>
                  <span
                    className="lv2d-chip shrink-0"
                    style={{ background: 'var(--lv2d-warn-soft)', color: 'var(--lv2d-warn)' }}
                  >
                    Check status →
                  </span>
                </Link>
              )}
              {!processing && pendingReview > 0 && (
                <Link
                  href={`/workspace/${workspace.id}/pipeline`}
                  className="lv2d-card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-[var(--lv2d-border-strong)]"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: 'var(--lv2d-bg-2)',
                      color: 'var(--lv2d-primary)',
                      border: '1px solid var(--lv2d-border)',
                    }}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[14px]">
                      {pendingReview} draft{pendingReview === 1 ? '' : 's'} ready to review
                    </p>
                    <p
                      className="mt-0.5 text-[12.5px]"
                      style={{ color: 'var(--lv2d-muted)' }}
                    >
                      Approve your favorites so the scheduler can line them up.
                    </p>
                  </div>
                  <span className="lv2d-btn-primary shrink-0">
                    Start reviewing <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              )}
              {!processing && pendingReview === 0 && readyContent && (
                <Link
                  href={`/workspace/${workspace.id}/content/${readyContent.id}/outputs`}
                  className="lv2d-card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-[var(--lv2d-border-strong)]"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: 'var(--lv2d-bg-2)',
                      color: 'var(--lv2d-primary)',
                      border: '1px solid var(--lv2d-border)',
                    }}
                  >
                    <Wand2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[14px]">
                      &ldquo;{readyContent.title ?? 'Content'}&rdquo; is ready
                    </p>
                    <p
                      className="mt-0.5 text-[12.5px]"
                      style={{ color: 'var(--lv2d-muted)' }}
                    >
                      Turn it into platform-ready drafts.
                    </p>
                  </div>
                  <span className="lv2d-btn-primary shrink-0">
                    Make posts <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              )}

              {/* ── Stats ── compact 4-up strip in one card so it
                  reads as a single instrument panel, not four heavy
                  cards stacked across half the screen. */}
              {stats && (
                <section className="lv2d-card lv2d-ring-soft">
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid var(--lv2d-border)' }}
                  >
                    <span className="lv2d-mono-label">At a glance · last 7 days</span>
                    <Link href="/analytics" className="lv2d-btn-ghost-sm">
                      Open analytics <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div
                    className="grid grid-cols-2 lg:grid-cols-4"
                    style={{ background: 'var(--lv2d-border)', gap: '1px' }}
                  >
                  {[
                    {
                      key: 'content',
                      label: 'Videos',
                      value: stats.totalContent,
                      thisMonth: stats.contentThisMonth,
                      lastMonth: stats.contentLastMonth,
                      icon: Video,
                      spark: stats.contentByDay,
                      href: `/workspace/${workspace.id}`,
                      tone: {
                        bg: 'var(--lv2d-primary-soft)',
                        fg: 'var(--lv2d-primary)',
                      },
                    },
                    {
                      key: 'outputs',
                      label: 'Posts',
                      value: stats.totalOutputs,
                      thisMonth: stats.outputsThisMonth,
                      lastMonth: stats.outputsLastMonth,
                      icon: Layers,
                      spark: stats.outputsByDay,
                      href: `/workspace/${workspace.id}/pipeline`,
                      tone: {
                        bg: 'var(--lv2d-primary-soft)',
                        fg: 'var(--lv2d-primary)',
                      },
                    },
                    {
                      key: 'approved',
                      label: 'Approved',
                      value: stats.approvedOutputs,
                      thisMonth: 0,
                      lastMonth: 0,
                      icon: CheckCircle2,
                      spark: null,
                      href: `/workspace/${workspace.id}/pipeline`,
                      tone: {
                        bg: 'var(--lv2d-primary-soft)',
                        fg: 'var(--lv2d-primary)',
                      },
                    },
                    {
                      key: 'starred',
                      label: 'Starred',
                      value: stats.starredOutputs,
                      thisMonth: 0,
                      lastMonth: 0,
                      icon: Star,
                      spark: null,
                      href: `/workspace/${workspace.id}/pipeline`,
                      tone: {
                        bg: 'var(--lv2d-accent)',
                        fg: 'var(--lv2d-accent-ink)',
                      },
                    },
                  ].map((m) => (
                    <Link
                      key={m.key}
                      href={m.href}
                      className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-[var(--lv2d-bg-2)]"
                      style={{ background: 'var(--lv2d-card)' }}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: m.tone.bg,
                          color: m.tone.fg,
                          boxShadow:
                            '0 1px 0 rgba(255,255,255,.4) inset, 0 6px 14px -8px rgba(42,26,61,.25)',
                        }}
                      >
                        <m.icon className="h-[15px] w-[15px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className="lv2d-sans-d lv2d-tabular text-[22px] font-bold leading-none"
                            style={{
                              color:
                                m.value === 0
                                  ? 'var(--lv2d-muted)'
                                  : 'var(--lv2d-fg)',
                              opacity: m.value === 0 ? 0.55 : 1,
                            }}
                          >
                            {m.value === 0 ? '—' : m.value}
                          </span>
                          {(m.thisMonth > 0 || m.lastMonth > 0) && (
                            <DeltaChip current={m.thisMonth} previous={m.lastMonth} />
                          )}
                        </div>
                        <p
                          className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                          style={{
                            color: 'var(--lv2d-muted)',
                            fontFamily:
                              'var(--font-inter-tight), var(--font-inter), sans-serif',
                          }}
                        >
                          {m.label}
                        </p>
                      </div>
                      {m.spark ? (
                        <Sparkline
                          data={m.spark}
                          width={64}
                          height={22}
                          variant="bars"
                          label={`${m.label} last 7 days`}
                        />
                      ) : (
                        <div
                          className="h-[22px] w-16 shrink-0 rounded-sm"
                          aria-hidden
                          style={{
                            background:
                              'repeating-linear-gradient(90deg, var(--lv2d-border) 0 4px, transparent 4px 8px)',
                            opacity: 0.6,
                          }}
                        />
                      )}
                    </Link>
                  ))}
                  </div>
                </section>
              )}

              {/* ── Recent drafts + Sidebar ─────────────────────── */}
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <section className="lv2d-card lv2d-ring-soft">
                    <div
                      className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: '1px solid var(--lv2d-border)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="lv2d-mono-label">Recent drafts</span>
                      </div>
                      <Link
                        href={`/workspace/${workspace.id}/pipeline`}
                        className="lv2d-btn-ghost-sm"
                      >
                        All drafts <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    {recentOutputs.length === 0 ? (
                      <div className="flex flex-col items-center px-5 py-10 text-center">
                        <p className="text-[13px]" style={{ color: 'var(--lv2d-fg)' }}>
                          No drafts yet.
                        </p>
                        <p
                          className="mt-1 max-w-sm text-[11.5px]"
                          style={{ color: 'var(--lv2d-muted)' }}
                        >
                          Drop in a video and we&apos;ll have platform-ready cuts in about 30
                          seconds.
                        </p>
                        <Link
                          href={`/workspace/${workspace.id}/content/new`}
                          className="lv2d-btn-accent mt-4"
                        >
                          <span className="text-base leading-none">+</span> Import a video
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ) : (
                      <div className="lv2d-divide">
                        {recentOutputs.map((d) => {
                          const chip = stateChip[d.state] ?? stateChip.draft!
                          return (
                            <Link
                              key={d.id}
                              href={`/workspace/${workspace.id}/pipeline`}
                              className="lv2d-row-hover flex items-center gap-3 px-4 py-3"
                            >
                              <div className="lv2d-thumb h-12 w-[72px] shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold">{d.title}</p>
                                <div
                                  className="mt-1 flex items-center gap-2 text-[11px]"
                                  style={{ color: 'var(--lv2d-muted)' }}
                                >
                                  <span
                                    className="lv2d-chip"
                                    style={{ background: chip.bg, color: chip.fg }}
                                  >
                                    {chip.label}
                                  </span>
                                  <span>·</span>
                                  <span className="lv2d-mono">
                                    {PLATFORM_LABELS[d.platform as keyof typeof PLATFORM_LABELS] ??
                                      d.platform}
                                  </span>
                                </div>
                              </div>
                              <ArrowRight
                                className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity lv2d-row-hover-target"
                                style={{ color: 'var(--lv2d-muted)' }}
                                aria-hidden
                              />
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </section>

                  {/* Platform performance */}
                  {stats && (
                    <section className="lv2d-card lv2d-ring-soft">
                      <div
                        className="flex items-center justify-between px-5 py-3"
                        style={{ borderBottom: '1px solid var(--lv2d-border)' }}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5" style={{ color: 'var(--lv2d-primary)' }} />
                          <span className="lv2d-mono-label">Platform performance · 7d</span>
                        </div>
                        <Link href="/analytics" className="lv2d-btn-ghost-sm">
                          Analytics <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      {platformPerf.every((p) => p.posts === 0) ? (
                        <div className="flex flex-col items-center px-5 py-8 text-center">
                          <div className="mb-3 flex items-center gap-2">
                            {platformPerf.map((p) => (
                              <PlatformDot key={p.key} platform={p.key} />
                            ))}
                          </div>
                          <p className="text-[13px]" style={{ color: 'var(--lv2d-fg)' }}>
                            No posts published yet.
                          </p>
                          <p
                            className="mt-1 max-w-sm text-[11.5px]"
                            style={{ color: 'var(--lv2d-muted)' }}
                          >
                            Approve a draft and schedule it — TikTok, Reels, Shorts and
                            LinkedIn light up here once you ship.
                          </p>
                        </div>
                      ) : (
                      <div className="lv2d-divide">
                        {platformPerf.map((p) => {
                          const hasData = p.posts > 0
                          return (
                          <div key={p.key} className="flex items-center gap-3 px-5 py-3">
                            <PlatformDot platform={p.key} />
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-[13px] font-semibold"
                                style={{
                                  color: hasData ? undefined : 'var(--lv2d-fg-soft)',
                                }}
                              >
                                {p.name}
                              </p>
                              <p
                                className="lv2d-mono lv2d-tabular text-[11px]"
                                style={{ color: 'var(--lv2d-muted)' }}
                              >
                                {hasData
                                  ? `${p.views} views · ${p.posts} posts`
                                  : 'No posts yet'}
                              </p>
                            </div>
                            {/* Hide the sparkline entirely on zero-data rows —
                                rendering a flat line in muted gray reads as
                                "broken chart," not "nothing to chart yet." */}
                            {hasData ? (
                              <Sparkline
                                data={p.spark}
                                width={80}
                                height={22}
                                variant="line"
                                color={p.delta >= 0 ? 'var(--lv2d-success)' : 'var(--lv2d-danger)'}
                                label={`${p.name} trend`}
                              />
                            ) : (
                              <span
                                aria-hidden
                                className="block h-[22px] w-[80px] shrink-0"
                              />
                            )}
                            {p.posts > 0 && p.delta !== 0 ? (
                              <span
                                className="lv2d-chip"
                                style={
                                  p.delta > 0
                                    ? { background: 'var(--lv2d-success-soft)', color: 'var(--lv2d-success)' }
                                    : { background: '#F8E3E0', color: 'var(--lv2d-danger)' }
                                }
                              >
                                {p.delta > 0 ? (
                                  <TrendingUp className="h-2.5 w-2.5" />
                                ) : (
                                  <TrendingDown className="h-2.5 w-2.5" />
                                )}
                                {p.delta > 0 ? '+' : ''}
                                {p.delta}%
                              </span>
                            ) : null}
                          </div>
                        )
                        })}
                      </div>
                      )}
                    </section>
                  )}

                </div>

                <div className="space-y-4">
                  {/* Upcoming schedule */}
                  <section className="lv2d-card lv2d-ring-soft">
                    <div
                      className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: '1px solid var(--lv2d-border)' }}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--lv2d-primary)' }} />
                        <span className="lv2d-mono-label">Upcoming</span>
                      </div>
                      <Link
                        href={`/workspace/${workspace.id}/schedule?view=calendar`}
                        className="lv2d-btn-ghost-sm"
                      >
                        Calendar <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    {upcoming.length === 0 ? (
                      <div
                        className="px-5 py-8 text-center"
                        style={{ color: 'var(--lv2d-muted)' }}
                      >
                        <p className="text-[12.5px]">Nothing scheduled yet.</p>
                      </div>
                    ) : (
                      <div className="lv2d-divide">
                        {upcoming.map((day) => (
                          <div key={day.day} className="px-5 py-3">
                            <p
                              className="mb-2 text-[11px] font-bold"
                              style={{ color: 'var(--lv2d-muted)' }}
                            >
                              {day.day}
                            </p>
                            <div className="space-y-1.5">
                              {day.items.map((it, i) => (
                                <div key={i} className="flex items-center gap-3 text-[12px]">
                                  <span
                                    className="lv2d-mono lv2d-tabular w-[62px] text-[11px]"
                                    style={{ color: 'var(--lv2d-muted)' }}
                                  >
                                    {it.time}
                                  </span>
                                  <PlatformDot platform={it.platform} />
                                  <span className="flex-1 truncate">{it.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      className="flex items-center justify-between px-5 py-3"
                      style={{ borderTop: '1px solid var(--lv2d-border)' }}
                    >
                      <span className="text-[11px]" style={{ color: 'var(--lv2d-muted)' }}>
                        {scheduled.length === 0
                          ? 'Approve a draft to schedule it'
                          : `${scheduled.length} scheduled this week`}
                      </span>
                      {scheduled.length > 0 && (
                        <Link
                          href={`/workspace/${workspace.id}/schedule`}
                          className="lv2d-btn-ghost-sm"
                        >
                          <span className="text-sm leading-none">+</span> Schedule post
                        </Link>
                      )}
                    </div>
                  </section>

                  {/* Brand voice */}
                  <section className="lv2d-card lv2d-ring-soft p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare
                          className="h-3.5 w-3.5"
                          style={{ color: 'var(--lv2d-primary)' }}
                        />
                        <span className="lv2d-mono-label">Brand voice</span>
                      </div>
                      {brandVoice && (
                        <Link href="/settings/brand-voice" className="lv2d-btn-ghost-sm">
                          Tune <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    {brandVoice ? (
                      <div className="flex items-center gap-4">
                        <div
                          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: `conic-gradient(var(--lv2d-primary) ${(bvDoneCount / bvTotalCount) * 360}deg, var(--lv2d-muted-2) 0deg)`,
                          }}
                          title={`${bvDoneCount} of ${bvTotalCount} brand-voice fields filled`}
                        >
                          <div
                            className="flex h-16 w-16 flex-col items-center justify-center rounded-full"
                            style={{ background: 'var(--lv2d-card)' }}
                          >
                            <span className="lv2d-sans-d lv2d-tabular text-[22px] font-bold leading-none">
                              {bvDoneCount}
                              <span
                                className="lv2d-mono text-[11px] font-medium"
                                style={{ color: 'var(--lv2d-muted)' }}
                              >
                                /{bvTotalCount}
                              </span>
                            </span>
                            <span
                              className="lv2d-mono mt-0.5 text-[8px]"
                              style={{ color: 'var(--lv2d-muted)' }}
                            >
                              SETUP
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          {bvFields.map((f) => (
                            <div
                              key={f.label}
                              className="flex items-center gap-2 text-[12px]"
                              style={{
                                color: f.done ? 'var(--lv2d-fg)' : 'var(--lv2d-muted)',
                              }}
                            >
                              <span
                                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                                style={{
                                  background: f.done
                                    ? 'var(--lv2d-primary)'
                                    : 'var(--lv2d-muted-2)',
                                  color: f.done ? 'var(--lv2d-accent)' : 'transparent',
                                  fontSize: 9,
                                  fontWeight: 900,
                                }}
                              >
                                ✓
                              </span>
                              <span className="font-medium">{f.label}</span>
                            </div>
                          ))}
                          {bvDoneCount < bvTotalCount ? (
                            <Link href="/settings/brand-voice" className="lv2d-btn-primary-sm mt-1">
                              Finish setup <ArrowRight className="h-3 w-3" />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[12px]" style={{ color: 'var(--lv2d-muted)' }}>
                          No brand voice set yet. Clipflow uses a neutral tone by default.
                        </p>
                        <Link
                          href="/settings/brand-voice"
                          className="lv2d-btn-ghost mt-3 w-full justify-center"
                        >
                          Teach it your voice <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </section>

                  {/* Usage */}
                  {usage && (
                    <section className="lv2d-card lv2d-ring-soft p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap
                            className="h-3.5 w-3.5"
                            style={{ color: 'var(--lv2d-primary)' }}
                          />
                          <span className="lv2d-mono-label">Usage · {planDef.name}</span>
                        </div>
                        <span
                          className="lv2d-mono text-[10px]"
                          style={{ color: 'var(--lv2d-muted)' }}
                        >
                          {new Date()
                            .toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                            .toUpperCase()}
                        </span>
                      </div>
                      {[
                        {
                          label: 'Videos',
                          used: usage.contentItemsThisMonth,
                          max: planDef.limits.contentItemsPerMonth,
                        },
                        {
                          label: 'Posts',
                          used: usage.outputsThisMonth,
                          max: planDef.limits.outputsPerMonth,
                        },
                      ].map((u) => (
                        <div key={u.label} className="mb-3 last:mb-0">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold">{u.label}</span>
                            <span
                              className="lv2d-mono lv2d-tabular"
                              style={{ color: 'var(--lv2d-muted)' }}
                            >
                              {u.used}
                              {u.max !== -1 ? ` / ${u.max}` : ' / ∞'}
                            </span>
                          </div>
                          <div className="mt-1">
                            <UsageBar used={u.used} limit={u.max} />
                          </div>
                        </div>
                      ))}
                      {plan === 'free' && (
                        <Link
                          href="/billing"
                          className="lv2d-btn-primary lv2d-beam mt-2 w-full justify-center"
                        >
                          <Zap className="h-3 w-3" /> Upgrade <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </section>
                  )}
                </div>
              </div>

              {/* ── Integrations + Activity ─────────────────────── */}
              <div className="grid gap-4 lg:grid-cols-2">
                <section className="lv2d-card lv2d-ring-soft">
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid var(--lv2d-border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="lv2d-mono-label">AI providers</span>
                      <span
                        className="lv2d-mono lv2d-tabular rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: 'var(--lv2d-muted-2)',
                          color: 'var(--lv2d-muted)',
                        }}
                      >
                        {integrationsConnected}/{integrationRows.length}
                      </span>
                    </div>
                    {integrationsNeedAttention > 0 ? (
                      <span
                        className="lv2d-chip"
                        style={{ background: 'var(--lv2d-warn-soft)', color: 'var(--lv2d-warn)' }}
                      >
                        needs attention
                      </span>
                    ) : (
                      <Link href="/settings/ai-keys" className="lv2d-btn-ghost-sm">
                        Manage <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                  <div className="lv2d-divide">
                    {integrationRows.map((it) => (
                      <div
                        key={it.key}
                        className="lv2d-row-hover flex items-center gap-3 px-5 py-3"
                      >
                        <BrandLogo provider={it.key as AiProvider} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p
                              className="text-[13.5px] font-bold tracking-tight"
                              style={{
                                fontFamily:
                                  'var(--font-inter-tight), var(--font-inter), sans-serif',
                              }}
                            >
                              {it.name}
                            </p>
                            {it.ok ? (
                              <span className="relative flex h-1.5 w-1.5">
                                <span
                                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
                                  style={{ background: 'var(--lv2d-success)' }}
                                />
                                <span
                                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                                  style={{ background: 'var(--lv2d-success)' }}
                                />
                              </span>
                            ) : null}
                          </div>
                          <p
                            className="truncate text-[11.5px] leading-snug"
                            style={{ color: 'var(--lv2d-muted)' }}
                          >
                            {it.sub}
                          </p>
                        </div>
                        {it.ok ? (
                          <span
                            className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                            style={{
                              background: 'var(--lv2d-success-soft)',
                              color: 'var(--lv2d-success)',
                              fontFamily:
                                'var(--font-inter-tight), var(--font-inter), sans-serif',
                            }}
                          >
                            Connected
                          </span>
                        ) : (
                          <Link href="/settings/ai-keys" className="lv2d-btn-pill-sm">
                            <Plug className="h-2.5 w-2.5" />
                            Connect
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="lv2d-card lv2d-ring-soft">
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid var(--lv2d-border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Users2 className="h-3.5 w-3.5" style={{ color: 'var(--lv2d-primary)' }} />
                      <span className="lv2d-mono-label">Recent activity</span>
                    </div>
                  </div>
                  {activity.length === 0 ? (
                    <div
                      className="px-5 py-10 text-center"
                      style={{ color: 'var(--lv2d-muted)' }}
                    >
                      <p className="text-[13px]">No activity yet.</p>
                      <p className="mt-1 text-[11.5px]">
                        Team actions and AI runs show up here.
                      </p>
                    </div>
                  ) : (
                    <ul className="lv2d-divide">
                      {activity.slice(0, 5).map((a, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 px-5 py-2.5 text-[12.5px]"
                        >
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ background: a.color }}
                          >
                            {a.who[0]}
                          </span>
                          <span className="flex-1">
                            <b>{a.who}</b>{' '}
                            <span style={{ color: 'var(--lv2d-muted)' }}>{a.what}</span>
                          </span>
                          <span
                            className="lv2d-mono text-[10px]"
                            style={{ color: 'var(--lv2d-muted)' }}
                          >
                            {a.when}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </>
          )}
    </div>
  )
}

/* ── Outer shell + Suspense boundary ─────────────────────────────── */

function DashboardBodySkeleton() {
  return (
    <div className="lv2d-fade-in mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8 2xl:max-w-[1440px]">
      <div className="space-y-3">
        <div
          className="lv2-skeleton h-3 w-40 rounded"
          style={{ background: 'var(--lv2d-muted-2)' }}
        />
        <div
          className="lv2-skeleton h-12 w-80 rounded-lg"
          style={{ background: 'var(--lv2d-muted-2)' }}
        />
        <div
          className="lv2-skeleton h-4 w-64 rounded"
          style={{ background: 'var(--lv2d-muted-2)' }}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="lv2-skeleton h-24 rounded-xl"
            style={{ background: 'var(--lv2d-muted-2)' }}
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div
          className="lv2-skeleton h-80 rounded-2xl lg:col-span-2"
          style={{ background: 'var(--lv2d-muted-2)' }}
        />
        <div className="space-y-4">
          <div
            className="lv2-skeleton h-36 rounded-2xl"
            style={{ background: 'var(--lv2d-muted-2)' }}
          />
          <div
            className="lv2-skeleton h-36 rounded-2xl"
            style={{ background: 'var(--lv2d-muted-2)' }}
          />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  // Render the dashboard shell (style + themed background) immediately so
  // the user sees the paper canvas while the heavy data widgets stream in
  // via Suspense. Everything data-dependent lives inside <DashboardBody />.
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DASH_STYLES }} />
      <div className="lv2-dash">
        <Suspense fallback={<DashboardBodySkeleton />}>
          <DashboardBody />
        </Suspense>
      </div>
    </>
  )
}
