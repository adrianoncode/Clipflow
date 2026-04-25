import type { VisualId } from '@/components/explore/feature-visual'

/**
 * Playbook content model — typed, richly-structured guides rendered
 * by a single polymorphic renderer on the detail page.
 *
 * Every guide is a flat sequence of sections; each section is a flat
 * sequence of blocks. The block union below is deliberately rich so
 * writers can compose "visual craft content" without adding more JSX
 * per guide. When a guide needs something outside this list, add a
 * new block type here (and a renderer in components/playbook/blocks/)
 * rather than hacking a one-off in the data file.
 */

export type GuideCategoryId =
  | 'getting-started'
  | 'brand-voice'
  | 'workflows'
  | 'hooks-captions'
  | 'agency'
  | 'troubleshooting'

export interface GuideCategory {
  id: GuideCategoryId
  name: string
  description: string
  emoji: string
}

export interface Guide {
  id: string
  slug: string
  category: GuideCategoryId
  /** Card + hero title. */
  title: string
  /** One-line pitch for the hub card. */
  subtitle: string
  /** Meta description + hero intro. */
  description: string
  /** Lightweight visual marker for nav + cards. */
  emoji: string
  readTimeMinutes: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  /** Last meaningful content update, ISO date. */
  updatedAt: string
  sections: GuideSection[]
  /** Cross-link slugs to other guides — shown at the end. */
  relatedGuides?: string[]
}

/**
 * Curated learning paths — a path is a hand-ordered sequence of guides
 * around one operator goal ("just starting", "scaling output", "agency
 * playbook"). A guide can belong to multiple paths. The Hub renders
 * paths as the primary IA; the guide page shows path context + next.
 */
export type PathId = 'start' | 'scale' | 'agency'

export interface LearningPath {
  id: PathId
  name: string
  pitch: string
  emoji: string
  /** Ordered list of guide IDs that make up this path. */
  guideIds: string[]
  /** Lime / plum / sand — used as the path's accent on cards + sidebar. */
  tone: 'lime' | 'plum' | 'sand'
}

export interface GuideSection {
  /** Anchor id — used by the right-rail TOC to deep-link + highlight. */
  id: string
  title: string
  content: GuideBlock[]
}

/**
 * The block union. Keep it tight — one block per content affordance.
 * Adding a new block requires a renderer in blocks/ and its own case
 * in the switch inside playbook-body.tsx.
 */
export type GuideBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 3 | 4; text: string }
  | { type: 'steps'; items: Array<GuideStep> }
  | { type: 'callout'; variant: CalloutVariant; title?: string; body: string }
  | { type: 'dos-donts'; dos: string[]; donts: string[] }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'checklist'; title?: string; items: string[] }
  | { type: 'visual'; visual: VisualId; caption?: string }
  | { type: 'example-box'; label: string; good: string; bad?: string }
  | { type: 'shortcut'; keys: string[]; label: string }
  /** Real product screenshot. Path is resolved against the Next.js
   *  public folder, so `/playbook/screenshots/foo.png` loads from
   *  `public/playbook/screenshots/foo.png`. Wraps with a framed
   *  card + optional caption to match the editorial layout. */
  | { type: 'screenshot'; src: string; alt: string; caption?: string }
  | { type: 'hr' }

export interface GuideStep {
  title: string
  body: string
  /** Optional tip rendered as a sub-callout under the step body. */
  tip?: string
}

export type CalloutVariant = 'tip' | 'warning' | 'pro' | 'example' | 'info'
