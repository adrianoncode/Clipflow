/**
 * Competitor comparison data — single source of truth for the landing
 * matrix + every /compare/clipflow-vs-X page.
 *
 * Rules for adding a row:
 *   - The claim must be defensible from public docs / pricing pages.
 *   - If Clipflow scores `false`, drop the row — we don't list gaps.
 *   - `highlight: true` only for rows where Clipflow is the only
 *     "yes" (so the ONLY CLIPFLOW chip reads honestly).
 */

export type CompetitorId = 'opusclip' | 'klap' | 'descript'

export interface CompetitorMeta {
  id: CompetitorId
  /** Display name used in headings, matrix columns, meta titles. */
  name: string
  /** URL-safe slug for /compare/clipflow-vs-<slug>. */
  slug: string
  /** One-sentence positioning of the competitor — used on the detail page. */
  tagline: string
  /** What the incumbent gets right — shown on the detail page as
   *  honest credit, not flamebait. */
  strongPoints: string[]
  /** The switch-pitch paragraph — why Clipflow wins for the user's
   *  actual job. Written in second person, ~40-60 words. */
  switchPitch: string
  /** Three specific reasons to switch, used as detail-page highlight
   *  cards. Keep each under 14 words. */
  topReasons: string[]
}

export const COMPETITORS: Record<CompetitorId, CompetitorMeta> = {
  opusclip: {
    id: 'opusclip',
    name: 'OpusClip',
    slug: 'opusclip',
    tagline:
      'The clip-finder leader — strong at extracting short-form from long video, weak on brand voice + agency workflow.',
    strongPoints: [
      'Fastest clip-extraction engine on the market',
      'Large library of caption templates',
      'Simple single-creator workflow',
    ],
    switchPitch:
      'OpusClip nails the clip-finder. Clipflow nails everything that comes after: captions in your brand voice, Brand Kit on every render, A/B hook testing, white-label client review links, and unlimited client workspaces on the Studio plan. If you are an agency or a creator who cares about consistency, you will feel the difference within the first week.',
    topReasons: [
      'Captions written in your brand voice, not generic templates',
      'Full Brand Kit (logo, color, font, intro/outro) on every render',
      'White-label review links for agency client approvals',
    ],
  },
  klap: {
    id: 'klap',
    name: 'Klap',
    slug: 'klap',
    tagline:
      'Affordable clip-and-caption SaaS targeting solo creators with lean budgets.',
    strongPoints: [
      'Low price point for single-creator use',
      'Simple upload-to-clips pipeline',
      'Built-in basic reframe',
    ],
    switchPitch:
      'Klap is optimised for a single creator producing a handful of clips per month. Clipflow is built for sustained weekly volume + teams: Brand Kit, Scheduler, A/B hook testing, and Studio-tier unlimited client workspaces. You also keep Klap\u2019s price advantage because Clipflow is BYOK — you pay OpenAI / Anthropic / Google directly at cost, we add zero markup.',
    topReasons: [
      'BYOK pricing — zero markup on AI tokens',
      'Scheduler + auto-publish to 4 platforms (Klap has no scheduler)',
      'Team seats, roles, audit log on the Studio plan',
    ],
  },
  descript: {
    id: 'descript',
    name: 'Descript',
    slug: 'descript',
    tagline:
      'Full video-editor in a doc-style UI — powerful for long-form editing, heavy for repurposing workflows.',
    strongPoints: [
      'Transcript-based editing is genuinely great',
      'Strong voice-clone + overdub features',
      'Large ecosystem of integrations',
    ],
    switchPitch:
      'Descript wants you to edit. Clipflow wants you to ship. If you are already done editing the source and want it repurposed into 50+ platform-native posts with captions, hooks, scheduling and brand consistency — Descript is overkill. Clipflow\u2019s pipeline starts where Descript\u2019s ends: one long recording in, platform-ready drafts out, with Brand Voice keeping every caption on-brand.',
    topReasons: [
      'Built for repurposing, not editing — zero learning curve',
      'Scheduler + auto-publish included (Descript has neither)',
      'Agency-ready: client workspaces, white-label review, roles',
    ],
  },
}

/** Supports one-to-many comparisons ordered alphabetically by display name. */
export const ALL_COMPETITOR_IDS: CompetitorId[] = ['descript', 'klap', 'opusclip']

/* ────────────────────────────────────────────────────────────────
 * Matrix rows — the capability grid shared across landing + detail
 * pages. Each detail page filters to its own competitor column.
 * ──────────────────────────────────────────────────────────────── */

export interface MatrixRow {
  label: string
  detail?: string
  clipflow: boolean | string
  values: Partial<Record<CompetitorId, boolean | string>>
  /** Marks "only Clipflow does this" rows for the ONLY CLIPFLOW chip. */
  highlight?: boolean
}

export const MATRIX_ROWS: MatrixRow[] = [
  {
    label: 'Clip Finder with virality scoring',
    detail: 'Ranks clips by hook strength, not just length.',
    clipflow: true,
    values: { opusclip: true, klap: true, descript: false },
  },
  {
    label: 'Writes in your brand voice',
    detail: 'Reads your past posts, matches tone + vocabulary + hooks.',
    clipflow: true,
    values: { opusclip: false, klap: false, descript: false },
    highlight: true,
  },
  {
    label: 'Brand Kit on every render',
    detail: 'Logo, color, custom font, intro/outro — automatic.',
    clipflow: true,
    values: { opusclip: 'Logo only', klap: false, descript: 'Manual per-project' },
    highlight: true,
  },
  {
    label: 'Scheduler with auto-publish',
    detail: 'TikTok, Instagram, YouTube, LinkedIn on a calendar.',
    clipflow: true,
    values: { opusclip: 'Via Zapier', klap: false, descript: false },
  },
  {
    label: 'A/B test hooks before publish',
    detail: 'Three variants, pick the winner, track performance.',
    clipflow: true,
    values: { opusclip: false, klap: false, descript: false },
    highlight: true,
  },
  {
    label: 'White-label client review links',
    detail: 'Your agency brand on the client-facing surface, not theirs.',
    clipflow: true,
    values: { opusclip: false, klap: false, descript: false },
    highlight: true,
  },
  {
    label: 'Unlimited client workspaces',
    detail: 'One account, separate context per client.',
    clipflow: true,
    values: {
      opusclip: '1 workspace',
      klap: '1 workspace',
      descript: '1 workspace',
    },
  },
  {
    label: 'Team seats with roles',
    detail: 'Owner / editor / reviewer / client — audit log included.',
    clipflow: true,
    values: { opusclip: '+$25/seat', klap: false, descript: '+$30/seat' },
  },
  {
    label: 'BYOK — you pay your AI provider at cost',
    detail: 'No markup on OpenAI / Anthropic / Google tokens.',
    clipflow: true,
    values: { opusclip: false, klap: false, descript: false },
    highlight: true,
  },
  {
    label: 'Creator research across platforms',
    detail: "What\u2019s working in your niche, aggregated.",
    clipflow: true,
    values: { opusclip: false, klap: false, descript: false },
  },
]
