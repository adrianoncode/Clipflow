/**
 * Feature + Use-case catalog — single source of truth for every
 * /features/* and /for/* page. Kept flat (not a nested module system)
 * so adding a new page is a single data-entry edit.
 *
 * Each entry maps to a rich detail page via the shared template in
 * components/explore/explore-detail.tsx.
 */

export type FeatureId =
  | 'viral-moments'
  | 'brand-voice'
  | 'clip-finder'
  | 'brand-kit'
  | 'scheduler'
  | 'ab-hook-testing'
  | 'white-label-review'
  | 'thumbnail-studio'
  | 'idea-generator'

export type UseCaseId =
  | 'podcasters'
  | 'agencies'
  | 'coaches'
  | 'founders'
  | 'creators'

export interface ExploreEntry {
  id: FeatureId | UseCaseId
  /** URL-safe slug. Matches the route segment. */
  slug: string
  /** Display name for nav/list contexts. */
  name: string
  /** One-liner shown in grids / hub pages. */
  tagline: string
  /** Long-form description for SEO meta + hero intro. */
  description: string
  /** Emoji used as a lightweight visual marker in nav + cards. */
  emoji: string
  /** Optional visual slot id. Maps to components in `components/explore/
   *  feature-visual.tsx`. Rendered near the hero so the detail page
   *  isn't a wall of text. */
  visual?:
    | 'clip-finder'
    | 'brand-kit'
    | 'schedule'
    | 'hook-test'
    | 'review-link'
    | 'analytics'
    | 'thumbnail'
    | 'idea-generator'
    | 'brand-voice'
    | 'pipeline-flow'
    | 'rss-flow'
    | 'agency-flow'
    | 'viral-moments'
  /** Sections rendered on the detail page — structured so the page
   *  layout stays identical while content varies. */
  sections: Array<{
    eyebrow: string
    title: string
    body: string
    /** Optional list of short bullet points rendered inside the
     *  section — each one a single sentence, not a paragraph. */
    bullets?: string[]
  }>
  /** "Works well with" cross-links to other feature slugs. */
  relatedFeatures?: FeatureId[]
  /** Signed-off highlight stats pinned at the top of the page. */
  highlights: Array<{ value: string; label: string }>
  /** What plan(s) this feature is available on, for accurate badging. */
  availability: string
  /** Canonical CTA text — always overridable to match context. */
  ctaText: string
}

/* ────────────────────────────────────────────────────────────────
 * Features
 * ──────────────────────────────────────────────────────────────── */

export const FEATURES: Record<FeatureId, ExploreEntry> = {
  'viral-moments': {
    id: 'viral-moments',
    slug: 'viral-moments',
    name: 'Viral Moments',
    tagline:
      'AI scans your long-form content and pulls the 3\u20138 most postable 20\u201360s clips \u2014 with hooks, scores, and karaoke captions, ready to publish.',
    description:
      'Upload a podcast, livestream, or YouTube video. Clipflow\u2019s Viral Moments detection reads the transcript, picks the 3\u20138 segments most likely to land on TikTok / Reels / Shorts, and returns each one with a hook, a virality score (0\u2013100), and a short explanation of why it works. One click renders a 9:16 clip with burned-in karaoke captions, hook overlay, and optional direct-publish to all four platforms.',
    emoji: '\u2728',
    visual: 'viral-moments',
    availability: 'Available on all plans \u2014 BYOK pricing',
    ctaText: 'Try Viral Moments free',
    highlights: [
      { value: '3\u20138', label: 'Clips detected per upload, each with a hook and a reason' },
      { value: '0\u2013100', label: 'Virality score per clip \u2014 color-coded in the UI' },
      { value: '\u2248 60s', label: 'From click to rendered 9:16 MP4 (Shotstack render)' },
    ],
    sections: [
      {
        eyebrow: 'The problem',
        title: 'The clip worth posting is buried in 47 minutes of context.',
        body:
          'You recorded an hour. You know there\u2019s one banger in there. OpusClip-style tools give you 20 generic "clips" sliced by silence \u2014 most are filler. Finding the real moment takes 30 minutes of scrubbing, and by then your posting window has closed. The bottleneck isn\u2019t editing. It\u2019s selection.',
      },
      {
        eyebrow: 'How we solve it',
        title: 'AI reads the transcript, not the waveform.',
        body:
          'Viral Moments runs your transcript through a producer-style prompt that weighs hook strength, emotional peaks, quotability, and pacing. Each candidate clip gets a 20\u201360s window, snapped to word boundaries so nothing cuts mid-sentence. The scoring is transparent \u2014 you see the hook, the reason, the score, and can delete anything that doesn\u2019t fit before spending a render credit.',
        bullets: [
          'Hook strength (40%) \u2014 does the first 2s earn the next 58?',
          'Emotional peak (30%) \u2014 is there a moment worth remembering?',
          'Quotability (20%) \u2014 can it stand alone as a caption?',
          'Pacing (10%) \u2014 does the segment end clean, not mid-thought?',
        ],
      },
      {
        eyebrow: 'The output',
        title: 'Render once, ship to every platform.',
        body:
          'Click render \u2014 Clipflow trims the clip via Shotstack, adds karaoke captions (2\u20133 word chunks synced to Whisper word-timings, not guessed line-breaks), burns a hook overlay for the first 2.5 seconds, and crops to 9:16 with a manual override if the speaker isn\u2019t centered. The rendered MP4 sits in your library with a thumbnail, ready for the built-in "Post to TikTok / Reels / Shorts / LinkedIn" button.',
        bullets: [
          'Four caption styles: TikTok Bold, Minimal, Neon Yellow, White Bar',
          'Manual crop-x override with a drag-to-reposition 9:16 guide',
          'Batch render every draft with one click',
          'Direct publish via Upload-Post \u2014 no download/upload cycle',
        ],
      },
      {
        eyebrow: 'Why not OpusClip / Klap',
        title: 'Because selection beats volume.',
        body:
          'The incumbents give you 40 auto-sliced clips and let you sort. Viral Moments gives you 3\u20138 ranked clips with a hook and a reason. You spend render credits only on the ones you\u2019d actually post. Combined with Brand Voice, Brand Kit, and white-label review links, it\u2019s the full content-repurposing pipeline \u2014 not a clip grinder.',
      },
    ],
    relatedFeatures: ['brand-voice', 'brand-kit', 'ab-hook-testing', 'thumbnail-studio'],
  },

  'brand-voice': {
    id: 'brand-voice',
    slug: 'brand-voice',
    name: 'Brand Voice',
    tagline:
      'Captions that sound like you, not like a template bank. Learned from your own past posts.',
    description:
      'Clipflow\u2019s Brand Voice engine reads your existing captions, hooks, and writing style to match tone, vocabulary, and rhythm on every new draft. Stop editing AI output into your own voice every time.',
    emoji: '🎙️',
    visual: 'brand-voice',
    availability: 'Available on Creator and Studio plans',
    ctaText: 'Train your Brand Voice',
    highlights: [
      { value: '3', label: 'Dimensions tracked — tone, avoid-list, hook style' },
      { value: '92%', label: 'Of users can\u2019t distinguish AI from their own drafts' },
      { value: '0', label: 'Ongoing prompt tweaking required after setup' },
    ],
    sections: [
      {
        eyebrow: 'The problem',
        title: 'Generic AI output breaks trust with your audience.',
        body:
          'Most tools generate captions that read exactly like other AI captions. Over a few weeks your audience notices: the rhythm changes, the word choices feel canned, the hooks read as templates. Creators end up editing every AI draft back into their own voice — which defeats the point.',
      },
      {
        eyebrow: 'How we solve it',
        title: 'Three clean dimensions, no prompt engineering.',
        body:
          'Brand Voice captures three things: your tone of voice (specific examples, not adjectives), words you never use (jargon, trigger words, mis-aligned phrasing), and an example of a hook that landed well with your audience. Clipflow layers these on top of every draft generation — platform template first, then your voice.',
        bullets: [
          'Tone — one paragraph describing how you actually sound',
          'Words to avoid — phrases that read as "not you"',
          'Example hook — the anchor for voice calibration',
        ],
      },
      {
        eyebrow: 'Workflow',
        title: 'Train once. Refresh everything with one click.',
        body:
          'Update your Brand Voice as your tone evolves and run bulk regenerate from the pipeline — every pending draft gets refreshed against the new voice in one shot. Agencies save hours per client when repositioning mid-campaign.',
      },
    ],
    relatedFeatures: ['clip-finder', 'ab-hook-testing', 'idea-generator'],
  },

  'clip-finder': {
    id: 'clip-finder',
    slug: 'clip-finder',
    name: 'Clip Finder',
    tagline:
      'The transcript-ranking engine behind Viral Moments \u2014 0\u2013100 scores, plain-English reasons, zero silence-slicing.',
    description:
      'Clip Finder is the detection engine that powers Viral Moments. It scans transcripts for hook strength, emotional peaks, and information density \u2014 then ranks clips 0\u2013100 with a plain-English explanation of why each one works. Available standalone, or run automatically as part of the Viral Moments pipeline.',
    emoji: '✂️',
    visual: 'clip-finder',
    availability: 'Available on all plans',
    ctaText: 'See clip finder in action',
    highlights: [
      { value: '0–100', label: 'Virality score on every clip, with reasoning' },
      { value: '8–14', label: 'Clips surfaced per 40-minute recording' },
      { value: '3', label: 'Buckets — FIRE, STRONG, OK — for fast triage' },
    ],
    sections: [
      {
        eyebrow: 'The problem',
        title: 'Not every clip is a hook — most tools don\u2019t know the difference.',
        body:
          'Clip Finders that just slice by silence or length surface a lot of filler. You end up scrubbing through clips that hit the technical requirements but have no pull. That\u2019s 20 minutes per recording of "did I already watch this one?" scrolling.',
      },
      {
        eyebrow: 'How we solve it',
        title: 'Score first, preview second.',
        body:
          'Every clip gets a 0-100 virality score based on hook strength, emotional peak analysis, and narrative completeness. Clips land in one of three buckets: FIRE (90+), STRONG (75-89), OK (50-74). You pick from the top of the list and the rest is ignored.',
        bullets: [
          'Hook strength — does the first line earn the next seven?',
          'Emotional peak — is there a moment worth remembering?',
          'Narrative completeness — does it stand alone without context?',
        ],
      },
      {
        eyebrow: 'The output',
        title: 'Plain-English reasoning, not just a number.',
        body:
          'Each clip surfaces a short "why this works" note so you know whether to trust the score. Example: opens with a surprising claim — "Speed isn\u2019t about effort" — and delivers the reversal within 12 seconds. Classic pattern-interrupt hook. You get intuition and pattern recognition, not just ranking.',
      },
    ],
    relatedFeatures: ['viral-moments', 'brand-voice', 'ab-hook-testing', 'thumbnail-studio'],
  },

  'brand-kit': {
    id: 'brand-kit',
    slug: 'brand-kit',
    name: 'Brand Kit',
    tagline:
      'Logo, color, font, intro/outro, watermark — automatic on every rendered video.',
    description:
      'Define your Brand Kit once — logo, accent color, font family, intro and outro cards, watermark position. Clipflow applies it to every rendered video without a single manual step.',
    emoji: '🎨',
    visual: 'brand-kit',
    availability: 'Available on Creator and Studio plans',
    ctaText: 'Set up your Brand Kit',
    highlights: [
      { value: '6', label: 'Customizable elements — logo, color, font, intro, outro, watermark' },
      { value: '100%', label: 'Of renders auto-branded after setup' },
      { value: '0', label: 'Manual re-uploads when your logo changes — edit once' },
    ],
    sections: [
      {
        eyebrow: 'The problem',
        title: 'Branding is consistency, and consistency is hard at volume.',
        body:
          'Every creator knows the drill: the first few clips have your logo, the middle ones have it in the wrong corner, and the last one — the one that went viral — had no watermark at all. Competitors either skip Brand Kit or gate it behind per-clip configuration.',
      },
      {
        eyebrow: 'How we solve it',
        title: 'One setup. Every render.',
        body:
          'Upload your logo once (PNG or SVG), pick an accent color, choose a display font, set intro and outro card text. Clipflow renders every clip with the full kit applied. Change the logo tomorrow and all future clips use the new one — no per-render edits needed.',
        bullets: [
          'Watermark position — four corners, adjustable opacity',
          'Title cards — intro + outro with your accent gradient',
          'Render-time font loading — your actual font, not a lookalike',
        ],
      },
      {
        eyebrow: 'Agency workflow',
        title: 'One kit per client workspace.',
        body:
          'On the Studio plan, each client workspace has its own Brand Kit. Switch between clients and all new renders auto-apply the correct kit. Clients see their brand, not Clipflow\u2019s, on every deliverable.',
      },
    ],
    relatedFeatures: ['brand-voice', 'thumbnail-studio', 'white-label-review'],
  },

  scheduler: {
    id: 'scheduler',
    slug: 'scheduler',
    name: 'Scheduler + Auto-publish',
    tagline:
      'Calendar view, drag-to-schedule, auto-publishing to TikTok / Instagram / YouTube / LinkedIn.',
    description:
      'Drag approved drafts onto a calendar, set a time, and Clipflow publishes automatically via the Upload-Post gateway — one connection for all four platforms.',
    emoji: '📅',
    visual: 'schedule',
    availability: 'Creator (via BYO Upload-Post key) and Studio plans',
    ctaText: 'Open the scheduler',
    highlights: [
      { value: '4', label: 'Platforms — TikTok, Instagram, YouTube, LinkedIn' },
      { value: '1', label: 'API connection covers all four — Upload-Post gateway' },
      { value: '0', label: 'Manual post-logins on publish day' },
    ],
    sections: [
      {
        eyebrow: 'The problem',
        title: 'Publishing is the step that breaks creator workflows.',
        body:
          'You\u2019ve drafted, approved, and rendered — then you have to log in to four different platforms at the right time of day. Most tools either charge per-platform or break when one channel\u2019s API changes.',
      },
      {
        eyebrow: 'How we solve it',
        title: 'One calendar, one key, four platforms.',
        body:
          'Clipflow integrates with Upload-Post — a single gateway that handles TikTok, Instagram Reels, YouTube Shorts, and LinkedIn. You drop drafts onto a calendar slot, set a time, and Clipflow fires the publish at the exact moment. No platform logins on publish day, no Zapier middleware, no failed posts from expired tokens.',
        bullets: [
          'Drag-drop calendar view per workspace',
          'Per-platform scheduling — same draft, different times',
          'Cron-backed publish with automatic retry on transient failures',
        ],
      },
      {
        eyebrow: 'Error handling',
        title: 'Failed posts surface, not silent.',
        body:
          'If a post fails (Upload-Post auth expired, rate-limited, platform outage) the calendar marks it failed with a plain-English reason. Fix the root cause and retry with one click — no lost scheduling history.',
      },
    ],
    relatedFeatures: ['brand-kit', 'white-label-review'],
  },

  'ab-hook-testing': {
    id: 'ab-hook-testing',
    slug: 'ab-hook-testing',
    name: 'A/B Hook Testing',
    tagline:
      'Three hook variants, three psychological levers, pick the winner before you publish.',
    description:
      'Clipflow generates three alternative hooks for every draft — each using a different psychological trigger — so you pick the strongest opener before committing to a post.',
    emoji: '🎯',
    visual: 'hook-test',
    availability: 'Available on Creator and Studio plans',
    ctaText: 'Test your next hook',
    highlights: [
      { value: '3', label: 'Variants generated per draft, each with a different lever' },
      { value: '<10s', label: 'Generation time per batch of three' },
      { value: '1', label: 'Winner locked in and stored against the draft' },
    ],
    sections: [
      {
        eyebrow: 'The problem',
        title: 'The hook is the post — and you guess-and-check it.',
        body:
          'Short-form performance is almost entirely about the first 2.5 seconds. Most creators rewrite hooks 3-5 times per post. Without structured alternatives, you end up picking the one you wrote first.',
      },
      {
        eyebrow: 'How we solve it',
        title: 'Three psychological levers, one pick.',
        body:
          'Clipflow generates three variant hooks for every draft: a curiosity-gap opener (unresolved mystery), a contrarian take (challenges audience belief), and an emotional hook (leads with a felt moment). Each comes with a short note explaining why that lever might work for this specific clip.',
        bullets: [
          'Curiosity-gap — opens a loop, forces the watch-through',
          'Contrarian — surfaces tension, triggers stitch potential',
          'Emotional — opens on feeling, strong for story clips',
        ],
      },
      {
        eyebrow: 'Workflow',
        title: 'Pick one. Track it.',
        body:
          'Mark a variant as the winner and Clipflow stores it against the draft. When analytics come back, you can see which psychological lever is outperforming for your audience — and bias future generations toward it.',
      },
    ],
    relatedFeatures: ['clip-finder', 'brand-voice', 'idea-generator'],
  },

  'white-label-review': {
    id: 'white-label-review',
    slug: 'white-label-review',
    name: 'White-label Review Links',
    tagline:
      'Share a review link branded with your agency, not with Clipflow. Clients see your logo, your color, your name.',
    description:
      'Generate a no-login review URL scoped to one content item. Your agency\u2019s logo and accent color take over the page — the client never sees Clipflow\u2019s branding.',
    emoji: '🔗',
    visual: 'review-link',
    availability: 'Studio plan only',
    ctaText: 'See a sample review link',
    highlights: [
      { value: '100%', label: 'Of the review surface is under your brand' },
      { value: '0', label: 'Clipflow logos, watermarks, or mentions visible to the client' },
      { value: '∞', label: 'Review links per client workspace, with optional expiry' },
    ],
    sections: [
      {
        eyebrow: 'The problem',
        title: 'Your client thinks they\u2019re paying you, not your vendor.',
        body:
          'Every time a client sees a Clipflow logo on the review page, they\u2019re reminded there\u2019s an intermediary. That\u2019s fine for consumer tools, but agencies position themselves as the sole creative partner — branded surfaces matter.',
      },
      {
        eyebrow: 'How we solve it',
        title: 'One switch. Your brand, everywhere.',
        body:
          'Turn on white-label review on a workspace and the review page inherits your Brand Kit: logo in the header, accent color on the CTA, your agency name in the page title. The footer carries a small "Powered by Clipflow" credit that we\u2019re honest about but doesn\u2019t scream.',
        bullets: [
          'Logo swap — your PNG/SVG on the review header',
          'Accent color — your brand on buttons + highlights',
          'Page title + tab favicon — your agency name',
        ],
      },
      {
        eyebrow: 'Security',
        title: 'No-login, per-content-item, optional expiry.',
        body:
          'Review links are scoped to a single content item — you don\u2019t accidentally give clients access to other clients\u2019 drafts. Set an expiry if you need to (30 days default). Links support inline comments that get routed back into your pipeline board.',
      },
    ],
    relatedFeatures: ['brand-kit', 'scheduler'],
  },

  'thumbnail-studio': {
    id: 'thumbnail-studio',
    slug: 'thumbnail-studio',
    name: 'Thumbnail Studio',
    tagline:
      'Auto-generate YouTube / Square / LinkedIn thumbnails with your brand kit baked in.',
    description:
      'Pick a layout, tweak the headline, download. Clipflow renders a clean, brand-kit-aware thumbnail on the edge in <200ms — no Canva tab required.',
    emoji: '🖼️',
    visual: 'thumbnail',
    availability: 'Available on Creator and Studio plans',
    ctaText: 'Generate a thumbnail',
    highlights: [
      { value: '3', label: 'Layouts — YouTube 16:9, Square 1:1, LinkedIn 1200:627' },
      { value: '<200ms', label: 'Per-thumbnail render time on the edge' },
      { value: '0', label: 'Manual design work — brand kit auto-applied' },
    ],
    sections: [
      {
        eyebrow: 'The problem',
        title: 'YouTube thumbnails are 40% of CTR — and they\u2019re a workflow leak.',
        body:
          'Every creator ends up in Canva or Figma making thumbnails by hand after publishing the video. By the time the thumbnail is done, the first-hour CTR window has already closed.',
      },
      {
        eyebrow: 'How we solve it',
        title: 'Render a thumbnail as fast as you can type the headline.',
        body:
          'Type a title, pick a layout, and Clipflow generates a branded thumbnail in the background — your accent color, your logo text, your font. The headline\u2019s most impactful word gets highlighted automatically with your accent. Download as PNG and upload to YouTube.',
        bullets: [
          'Automatic headline highlight — picks the strongest keyword',
          'Brand-kit-aware colors and logo text — no setup',
          'Three layouts for YouTube / IG Square / LinkedIn landscape',
        ],
      },
      {
        eyebrow: 'Under the hood',
        title: 'Edge-rendered. No persistence.',
        body:
          'Thumbnails are generated on-demand at a URL — the URL IS the thumbnail. No save-to-S3 step, no storage overhead. Share the URL, save the file, regenerate with different text — everything happens in the current tab.',
      },
    ],
    relatedFeatures: ['brand-kit', 'clip-finder'],
  },

  'idea-generator': {
    id: 'idea-generator',
    slug: 'idea-generator',
    name: 'Idea Generator',
    tagline:
      'Give a topic. Get 8-10 on-brand content ideas with hooks, outlines, and platform recommendations.',
    description:
      'Feed Clipflow a rough topic. Get back a structured set of content ideas — each with a working title, a hook, a 3-5 bullet outline, and suggested platforms — all tuned to your Brand Voice.',
    emoji: '💡',
    visual: 'idea-generator',
    availability: 'Available on Creator and Studio plans',
    ctaText: 'Generate ideas',
    highlights: [
      { value: '8–10', label: 'Distinct ideas per topic — no trivial reframings' },
      { value: '<15s', label: 'Per batch, including Brand Voice calibration' },
      { value: '4', label: 'Structural elements per idea — title, hook, outline, platforms' },
    ],
    sections: [
      {
        eyebrow: 'The problem',
        title: 'Creators get stuck on "what to record next" more than on anything else.',
        body:
          'You sit down to batch-record a week of content. You have the time and the setup — you just don\u2019t have the list. Most brainstorming tools give you generic topics or require you to prompt-engineer your way to good output.',
      },
      {
        eyebrow: 'How we solve it',
        title: 'Ideas that sound like you, not like a prompt.',
        body:
          'Clipflow uses your Brand Voice as the calibration layer. Ask for "indie SaaS burnout" ideas and you\u2019ll get angles your audience would click — not a LinkedIn gurus\u2019 greatest hits. Each idea includes the hook that\u2019d open the recording, which is 80% of the work for most creators.',
        bullets: [
          'Title + hook — ready to drop into a record button',
          'Outline — 3-5 bullets so you don\u2019t wing the middle',
          'Platforms suggested — where this specific angle lands best',
          'Estimated length — so you plan your recording session',
        ],
      },
      {
        eyebrow: 'Workflow',
        title: 'Pick one. Record. Import. Repurpose.',
        body:
          'Every idea card has a "Record this" button that pre-fills the new-content import page with the title and hook as scene notes. Record → upload → Clipflow runs the full pipeline. From idea to published clip in under 90 minutes.',
      },
    ],
    relatedFeatures: ['brand-voice', 'clip-finder'],
  },
}

/* ────────────────────────────────────────────────────────────────
 * Use cases
 * ──────────────────────────────────────────────────────────────── */

export const USE_CASES: Record<UseCaseId, ExploreEntry> = {
  podcasters: {
    id: 'podcasters',
    slug: 'podcasters',
    name: 'For podcasters',
    tagline:
      'One 45-minute episode becomes 20+ short-form clips, captions, and LinkedIn takes without a production assistant.',
    description:
      'Podcasters are Clipflow\u2019s sweet spot. Long-form conversation converts into short-form clips better than any other content type — and we\u2019ve tuned the pipeline specifically for the dynamics of interview-style audio.',
    emoji: '🎙️',
    visual: 'rss-flow',
    availability: 'Creator plan fits most podcasters; Studio for agencies running podcast clients',
    ctaText: 'See the podcast workflow',
    highlights: [
      { value: '45m → 20+', label: 'Clips per episode, ranked by hook strength' },
      { value: '<6h', label: 'From published episode to scheduled week of shorts' },
      { value: 'RSS', label: 'Auto-import new episodes from any feed' },
    ],
    sections: [
      {
        eyebrow: 'The pain',
        title: 'Podcast clips are the highest-leverage content you\u2019re not making.',
        body:
          'Every long-form episode has 15-25 clip-worthy moments. Extracting them by hand takes longer than recording the episode. You end up posting the "trailer" once on release day and the next 10 potential clips never happen.',
      },
      {
        eyebrow: 'The Clipflow workflow',
        title: 'RSS feed → auto-import → ranked clips → scheduled week.',
        body:
          'Point Clipflow at your podcast RSS feed. New episodes import automatically. The Clip Finder ranks the 8-14 strongest moments by hook strength. Brand Voice writes captions that match how you\u2019d write about your own show. Scheduler drops them across Monday-Friday.',
        bullets: [
          'RSS auto-import — new episodes appear in your library',
          'Transcript-first clip extraction — no silence-detection noise',
          'Guest attribution — hooks auto-include guest name + credit',
        ],
      },
      {
        eyebrow: 'Output',
        title: 'Quote-forward captions that sound like a podcaster, not a motivational page.',
        body:
          'Our podcast-niche template knows the difference between a podcast caption and an influencer caption. Expect em-dash attribution, soft CTAs back to the full episode, and hook lines that preserve the host\u2019s actual phrasing.',
      },
    ],
    relatedFeatures: ['clip-finder', 'brand-voice', 'scheduler'],
  },

  agencies: {
    id: 'agencies',
    slug: 'agencies',
    name: 'For agencies',
    tagline:
      'Run 10 clients\u2019 content from one Clipflow account. White-label everything client-facing. Stop juggling tools per client.',
    description:
      'Clipflow\u2019s Studio plan is built for agencies: unlimited client workspaces, team seats with roles, white-label review links, audit log, priority render queue. One account, sealed-off per-client context, zero leakage.',
    emoji: '🏢',
    visual: 'agency-flow',
    availability: 'Studio plan required',
    ctaText: 'See the agency workflow',
    highlights: [
      { value: '∞', label: 'Client workspaces per account' },
      { value: '100%', label: 'Of client surfaces branded with your agency, not Clipflow' },
      { value: 'Audit', label: 'Log shows who did what across every workspace' },
    ],
    sections: [
      {
        eyebrow: 'The pain',
        title: 'Agencies run 4+ tools per client because no single tool has the workflow.',
        body:
          'Descript for editing, OpusClip for clips, Later for scheduling, Notion for briefs, Slack for client approval. Every tool is billed per-seat. Every approval requires logins. Every rebrand requires tool re-configuration. Margins disappear into SaaS stacks.',
      },
      {
        eyebrow: 'The Clipflow workflow',
        title: 'One account. One Upload-Post key. N clients, separated.',
        body:
          'Each client gets their own workspace: their Brand Kit, their Brand Voice, their content library, their team seats, their review links. Content never leaks between workspaces. You switch clients in the sidebar and every generation auto-applies the right brand settings.',
        bullets: [
          'Unlimited client workspaces — no per-client pricing',
          'Per-workspace Brand Kit — automatic client-correct renders',
          'Team seats with roles — add freelancers without giving them everything',
          'Audit log — prove what changed, when, and by whom',
        ],
      },
      {
        eyebrow: 'Client surface',
        title: 'Your agency\u2019s brand on every review link.',
        body:
          'Clients log into a page that shows your logo, your colors, your agency name. The only Clipflow visible is a small "Powered by" footer. Comments route back into your pipeline board as actionable items — no screenshot-in-Slack required.',
      },
    ],
    relatedFeatures: ['white-label-review', 'brand-kit', 'scheduler'],
  },

  coaches: {
    id: 'coaches',
    slug: 'coaches',
    name: 'For coaches',
    tagline:
      'Coaches don\u2019t have a content-creation team. Clipflow is the team — frameworks-first captions, contrarian-take hooks, authority positioning.',
    description:
      'The Coach niche template is pre-tuned for the coach voice: frameworks, contrarian takes, and concrete actions over engagement questions. Built for 1-person expertise brands shipping weekly.',
    emoji: '🎯',
    visual: 'brand-voice',
    availability: 'Creator plan is enough for most solo coaches',
    ctaText: 'See the coach workflow',
    highlights: [
      { value: '1×', label: 'Weekly recording becomes 10+ authority-building posts' },
      { value: 'Framework', label: 'First — every caption hooks on a named concept' },
      { value: '0', label: 'Engagement-question endings (coaches don\u2019t beg for comments)' },
    ],
    sections: [
      {
        eyebrow: 'The pain',
        title: 'Generic AI output makes coaches sound like influencers.',
        body:
          'Default caption AI ends every post with "thoughts?" or "drop a comment below". For creators that\u2019s fine. For coaches positioning as experts, it\u2019s corrosive — it reads as seeking validation, not owning a position.',
      },
      {
        eyebrow: 'The Clipflow workflow',
        title: 'Coach-niche template + your Brand Voice.',
        body:
          'Select the Coach preset in Settings → Templates. Every caption now leads with a framework name, delivers a contrarian angle or specific lesson, and ends on a concrete action — not a question. Paired with your Brand Voice, the output sounds like you wrote it.',
        bullets: [
          'Framework-first hooks — named concepts over vague observations',
          'Contrarian angles — "the thing nobody tells you" openers',
          'Action endings — "go do X" not "what\u2019s your take?"',
        ],
      },
      {
        eyebrow: 'Output',
        title: 'Authority content at audience scale.',
        body:
          'Record one Loom, get captions across LinkedIn (thought-leadership format), TikTok (hook-heavy short), YouTube Shorts (SEO-tuned), and Instagram (aesthetic-first) — every one sounding like an expert, not a hype-merchant.',
      },
    ],
    relatedFeatures: ['brand-voice', 'clip-finder', 'idea-generator'],
  },

  founders: {
    id: 'founders',
    slug: 'founders',
    name: 'For founders',
    tagline:
      'SaaS + B2B founders want the audience, not the content-ops. Clipflow is the content team they don\u2019t have time to hire.',
    description:
      'Founders have 2-4 hours per week for content, total. Clipflow compresses the pipeline so one recording becomes a week of founder-voice posts across LinkedIn, Twitter-style shorts, and YouTube long-form SEO.',
    emoji: '💼',
    visual: 'pipeline-flow',
    availability: 'Creator plan; Studio if running with a content lead',
    ctaText: 'See the founder workflow',
    highlights: [
      { value: '2h', label: 'Weekly recording → full week of cross-platform content' },
      { value: 'LinkedIn-first', label: 'Default output tuned to founder-audience norms' },
      { value: '0', label: 'Time spent in a scheduler tab' },
    ],
    sections: [
      {
        eyebrow: 'The pain',
        title: 'Founders want to build an audience — but content takes the hours meant for building.',
        body:
          'Every founder knows the compound value of shipping weekly content. Nobody does it consistently because the production cost is 3-4x the record time. Hiring a contractor fixes nothing — they don\u2019t know your voice, and they cost $2-4K/mo.',
      },
      {
        eyebrow: 'The Clipflow workflow',
        title: 'Record a Loom. Post a week.',
        body:
          'Record a rough 10-20 minute Loom or Zoom reflection each week. Upload. Clipflow extracts the strongest moments, writes captions that sound like you (not like a VC thread), and schedules them across your channels. You see the week\u2019s content lined up in your calendar — and you can approve or regenerate from your phone in the grocery line.',
        bullets: [
          'SaaS-niche template — benefit-over-feature, specific numbers, no buzzwords',
          'LinkedIn-first formatting — the post structure your audience expects',
          'Mobile-first approval flow — no laptop required for content ops',
        ],
      },
      {
        eyebrow: 'Output',
        title: 'Content that reads like you built something, not like you\u2019re selling something.',
        body:
          'Our SaaS preset leans into story-driven, lesson-led posts. Specific company names stay in, vague "leverage / synergy" language stays out. The goal is authority through specificity.',
      },
    ],
    relatedFeatures: ['brand-voice', 'scheduler', 'idea-generator'],
  },

  creators: {
    id: 'creators',
    slug: 'creators',
    name: 'For creators',
    tagline:
      'Solo creators ship volume. Clipflow does the ops so you can spend the time on the recording, not the scheduler.',
    description:
      'If your job is being the face in the frame, you don\u2019t have time to be the editor too. Clipflow handles everything between record and publish — while keeping the voice that made your audience follow you.',
    emoji: '🎬',
    visual: 'pipeline-flow',
    availability: 'Creator plan — BYOK keeps costs at true AI cost',
    ctaText: 'See the creator workflow',
    highlights: [
      { value: '30s', label: 'From upload to first drafts ready to approve' },
      { value: 'Your voice', label: 'Not an AI template voice — trained on your past work' },
      { value: 'BYOK', label: 'Pay OpenAI directly at cost. No SaaS markup on AI.' },
    ],
    sections: [
      {
        eyebrow: 'The pain',
        title: 'The cost of creator-content isn\u2019t the recording — it\u2019s the editing.',
        body:
          'You can record 10 Loom sessions on a Sunday. You can\u2019t edit them. You can\u2019t write 40 captions by Wednesday. You can\u2019t schedule across four platforms without losing your afternoon.',
      },
      {
        eyebrow: 'The Clipflow workflow',
        title: 'Record volume. Approve fast. Ship daily.',
        body:
          'Clipflow assumes you\u2019re the bottleneck — so it minimizes your clicks. Imports auto-trigger clip extraction and caption generation. Drafts land on your phone in 30 seconds. Approve in the grocery line. Scheduler posts at the right time per platform.',
        bullets: [
          'Mobile-first approval — swipe to approve, hold to regenerate',
          'Virality-ranked clips — no scrubbing through filler',
          'A/B hook testing — pick the opener most likely to land',
        ],
      },
      {
        eyebrow: 'The economics',
        title: 'Your AI bill is the AI bill. Nothing on top.',
        body:
          'Clipflow is BYOK — you add your own OpenAI / Anthropic / Google key and we use it to generate. No 3x markup on tokens, no "credits" system that inflates costs. We charge for the workflow, not for reselling AI you can already buy.',
      },
    ],
    relatedFeatures: ['clip-finder', 'brand-voice', 'scheduler', 'ab-hook-testing'],
  },
}

/* ────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────── */

export const ALL_FEATURE_IDS: FeatureId[] = Object.keys(FEATURES) as FeatureId[]
export const ALL_USE_CASE_IDS: UseCaseId[] = Object.keys(USE_CASES) as UseCaseId[]
