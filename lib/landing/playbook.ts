import type { Guide, GuideCategory, GuideCategoryId, LearningPath, PathId } from './playbook-types'

/**
 * Curated learning paths. Order matters — the guide page navigates
 * "next" by stepping through `guideIds`. A guide can belong to
 * multiple paths; the page picks the most-recent path the user came
 * from (or the first one alphabetically as a fallback).
 */
export const PATHS: Record<PathId, LearningPath> = {
  start: {
    id: 'start',
    name: 'Just starting',
    pitch: 'Get from zero account to your first scheduled week of posts.',
    emoji: '🚀',
    tone: 'lime',
    guideIds: [
      'first-24-hours',
      'train-your-brand-voice',
      'hook-formulas-that-convert',
      'bulk-regenerate',
    ],
  },
  scale: {
    id: 'scale',
    name: 'Scaling output',
    pitch: 'Turn one long recording into a month of posts without losing voice.',
    emoji: '📈',
    tone: 'plum',
    guideIds: [
      'seven-day-podcast-workflow',
      'find-viral-moments',
      'hook-formulas-that-convert',
      'youtube-to-tiktok',
      'bulk-regenerate',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Going pro (agency)',
    pitch: 'Onboard clients, keep voice consistent, deliver weekly without chaos.',
    emoji: '🎯',
    tone: 'sand',
    guideIds: [
      'onboard-agency-client',
      'train-your-brand-voice',
      'hook-formulas-that-convert',
    ],
  },
}

export const PATH_ORDER: PathId[] = ['start', 'scale', 'agency']

/** Reverse-lookup: which paths contain this guide, in order. */
export function pathsContaining(guideId: string): LearningPath[] {
  return PATH_ORDER
    .map((id) => PATHS[id])
    .filter((p) => p.guideIds.includes(guideId))
}

/** Find next guide in a given path after the current one. */
export function nextInPath(path: LearningPath, currentGuideId: string): string | null {
  const i = path.guideIds.indexOf(currentGuideId)
  if (i < 0 || i === path.guideIds.length - 1) return null
  return path.guideIds[i + 1] ?? null
}

/** Find previous guide in a given path before the current one. */
export function prevInPath(path: LearningPath, currentGuideId: string): string | null {
  const i = path.guideIds.indexOf(currentGuideId)
  if (i <= 0) return null
  return path.guideIds[i - 1] ?? null
}

/**
 * Playbook — the in-app / SEO Knowledge base. Every guide is a full,
 * long-form workflow doc. The content layer sits in this file as a
 * flat array so updating a guide is a single edit away from shipping.
 *
 * Writing style: instructional, specific, defensible. No "AI-powered"
 * filler, no marketing-speak. Each guide should answer one concrete
 * question an existing user would actually type into a docs search.
 */

export const GUIDE_CATEGORIES: Record<GuideCategoryId, GuideCategory> = {
  'getting-started': {
    id: 'getting-started',
    name: 'Getting started',
    description: 'Your first hours with Clipflow.',
    emoji: '🚀',
  },
  'brand-voice': {
    id: 'brand-voice',
    name: 'Brand Voice',
    description: 'Getting captions that sound like you.',
    emoji: '🎙️',
  },
  workflows: {
    id: 'workflows',
    name: 'Workflows',
    description: 'End-to-end patterns that actually work.',
    emoji: '⚡',
  },
  'hooks-captions': {
    id: 'hooks-captions',
    name: 'Hooks & captions',
    description: 'The craft behind short-form that converts.',
    emoji: '🎯',
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    description: 'Running multiple clients without chaos.',
    emoji: '🏢',
  },
  troubleshooting: {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'When things do not work as expected.',
    emoji: '🛠️',
  },
}

export const GUIDES: Guide[] = [
  /* ──────────────────────────────────────────────────────────────
   * 1. Your first 24 hours
   * ────────────────────────────────────────────────────────────── */
  {
    id: 'first-24-hours',
    slug: 'your-first-24-hours-with-clipflow',
    category: 'getting-started',
    title: 'Your first 24 hours with Clipflow',
    subtitle:
      'The exact order of operations that gets your first clips scheduled by tomorrow.',
    description:
      'A tactical onboarding walk-through: the six steps that turn a brand-new Clipflow account into a scheduled week of cross-platform posts, in order of what matters most.',
    emoji: '🚀',
    readTimeMinutes: 8,
    difficulty: 'beginner',
    updatedAt: '2026-04-22',
    relatedGuides: [
      'train-your-brand-voice',
      'hook-formulas-that-convert',
    ],
    sections: [
      {
        id: 'what-you-need',
        title: 'What you need before you start',
        content: [
          {
            type: 'paragraph',
            text: 'Clipflow is a BYOK (bring-your-own-keys) product — we do not resell AI tokens. Before you import your first video, you need two things: one AI provider key for generation, and one Upload-Post key if you want to schedule auto-publishing. That is it. You can skip scheduling on day one and add it later.',
          },
          {
            type: 'checklist',
            title: 'Accounts to have ready',
            items: [
              'An OpenAI, Anthropic, or Google API key (any one works)',
              '(optional) An Upload-Post account for auto-publishing — free tier covers 10 posts/month',
              '(optional) A Shotstack key if you want MP4 renders with subtitles + brand kit burned in',
              'One long-form recording to import — podcast, Loom, Zoom, or 10+ minute reflection',
            ],
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'You do not need to set everything up on day one.',
            body: 'Minimum to generate drafts: an AI provider key + one content item. You can add Upload-Post and Shotstack when you are ready to publish and render. Most users skip scheduling on day one and batch-publish manually the first week.',
          },
        ],
      },
      {
        id: 'step-1-ai-keys',
        title: 'Step 1 — Connect your AI provider (2 minutes)',
        content: [
          {
            type: 'paragraph',
            text: 'Open Settings → AI Keys. Click the provider you already have an account with — OpenAI, Anthropic, or Google. Paste your API key. Done.',
          },
          {
            type: 'callout',
            variant: 'pro',
            title: 'Which provider should I pick?',
            body: 'For the overwhelming majority of creators: OpenAI (GPT-4o or higher). Anthropic (Claude) is strong on tone nuance — worth it if you care deeply about voice matching. Google (Gemini) has the most generous free tier if you are cost-sensitive. All three work with Clipflow.',
          },
          {
            type: 'shortcut',
            keys: ['⌘', 'K'],
            label: 'Open global search · type "ai keys"',
          },
        ],
      },
      {
        id: 'step-2-import',
        title: 'Step 2 — Import your first video (1 minute)',
        content: [
          {
            type: 'paragraph',
            text: 'Click + New content top-left, or land on the workflow home (Step 1 — Import). One Smart-Import box accepts everything: drop an MP4, paste a YouTube link, paste a website URL, paste an RSS feed, or type raw text. Clipflow auto-detects the source, no per-format tabs to pick.',
          },
          {
            type: 'dos-donts',
            dos: [
              'Upload or link your longest-form recording — the clip finder needs raw material',
              'Pick a recording where you talk naturally, not a prepared script',
              'If using YouTube, make sure transcripts are available on the video',
            ],
            donts: [
              'Do not import a 60-second vertical video — there is nothing to clip from',
              'Do not paste incomplete transcripts — broken timestamps hurt clip ranking',
              'Do not upload private recordings you have not reviewed — AI sees everything',
            ],
          },
          {
            type: 'callout',
            variant: 'info',
            body: 'For YouTube: Clipflow fetches the transcript via the YouTube API — no download needed, works in 5-10 seconds. For MP4 uploads we use Whisper to transcribe, which takes roughly one minute per 10 minutes of audio.',
          },
        ],
      },
      {
        id: 'step-3-generate',
        title: 'Step 3 — Generate your first drafts (30 seconds)',
        content: [
          {
            type: 'paragraph',
            text: 'Once the content status turns "Ready" (transcript present), click Generate. Clipflow produces four drafts in parallel: one TikTok, one Instagram, one YouTube Shorts, one LinkedIn. All four appear in your Drafts board within roughly 30 seconds.',
          },
          {
            type: 'steps',
            items: [
              {
                title: 'Open the content you just imported',
                body: 'Click the card from the library. You will see the transcript + a big "Generate drafts" CTA once it is ready.',
              },
              {
                title: 'Hit Generate',
                body: 'Clipflow runs four AI calls in parallel, one per platform. Watch the "Generating..." indicators tick through.',
              },
              {
                title: 'Review the output in Drafts',
                body: 'Click step 5 (Approve) on the workflow stepper — that opens the cross-video drafts board. Four fresh drafts ready for review, each card shows the caption, platform, and a virality-like ranking signal. The stepper is clickable end-to-end so you can jump straight there from any step.',
              },
            ],
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'First drafts often sound generic.',
            body: 'This is expected — Clipflow has not learned your voice yet. Do not edit them one by one. Instead, go directly to Step 4 and train your Brand Voice. Bulk-regenerate afterward.',
          },
        ],
      },
      {
        id: 'step-4-brand-voice',
        title: 'Step 4 — Train your Brand Voice (15 minutes, most important)',
        content: [
          {
            type: 'paragraph',
            text: 'This is the step most users skip and then wonder why the AI sounds generic. Settings → Brand Voice. Fill in three fields: tone, words to avoid, example hook. Specificity matters more than length — one sentence of detail beats a paragraph of vagueness.',
          },
          {
            type: 'visual',
            visual: 'brand-voice',
            caption:
              'Side-by-side of generic AI vs brand-voice output. The right side rotates through three voices to show adaptability.',
          },
          {
            type: 'example-box',
            label: 'Example Tone field',
            good:
              "I write in first person, use em-dashes instead of commas for pacing, never start sentences with 'So,' and always end short-form posts with a specific action — not an engagement question.",
            bad: 'Friendly, professional, approachable.',
          },
          {
            type: 'paragraph',
            text: 'After saving, jump back via step 5 (Approve) on the workflow stepper, select all four drafts, and click Bulk regenerate. The new drafts will be noticeably closer to how you actually write. If they are not, the Brand Voice copy is too vague — rewrite it more specifically.',
          },
        ],
      },
      {
        id: 'step-5-approve',
        title: 'Step 5 — Review and approve (10 minutes)',
        content: [
          {
            type: 'paragraph',
            text: 'On the Drafts board (workflow step 5 — Approve), read each draft. Minor edit: click inline and retype. Major miss: click Regenerate for a single-platform retry. Happy with it: swipe it right to Approved.',
          },
          {
            type: 'callout',
            variant: 'pro',
            title: 'Rule of thumb for approvals',
            body: 'Do not try to ship every draft. Approve your favorite two out of the four. Volume matters, but posting weak content trains your audience to scroll past you. Two strong posts beats four mediocre ones.',
          },
        ],
      },
      {
        id: 'step-6-schedule',
        title: 'Step 6 — Schedule or post manually',
        content: [
          {
            type: 'paragraph',
            text: 'If you have Upload-Post connected, click step 6 (Schedule) on the workflow stepper, drag your Approved drafts onto the calendar, set a time, done. If not, click Export on each draft — you will get a clean caption + any rendered assets to paste into each platform manually.',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Scheduling cadence that works',
            body: 'Space your four drafts across the week — do not bulk-publish on the same day. For most creators: Monday morning (LinkedIn), Tuesday + Thursday (TikTok), Friday (YouTube Shorts). Instagram whenever your audience is most active.',
          },
        ],
      },
      {
        id: 'next-steps',
        title: 'What to do tomorrow',
        content: [
          {
            type: 'paragraph',
            text: 'You now have a working pipeline. The next 6 days compound — not by adding more tools, but by refining the voice and the cadence.',
          },
          {
            type: 'checklist',
            title: 'Week 1 calendar',
            items: [
              'Day 2: Import another recording. Do NOT re-tune brand voice yet — you need more data points first.',
              'Day 3: Review yesterday\u2019s posts. Which hook got the most watch-through? Update your example hook in Brand Voice.',
              'Day 4: Try the A/B Hook Testing feature on your next draft. Pick the winner, ship it.',
              'Day 5: Generate a thumbnail for your YouTube post via Thumbnail Studio.',
              'Day 7: Review what worked. If the output still sounds off, the Brand Voice settings are still too vague — get more specific.',
            ],
          },
        ],
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────
   * 2. Train your Brand Voice in 30 minutes
   * ────────────────────────────────────────────────────────────── */
  {
    id: 'train-your-brand-voice',
    slug: 'train-your-brand-voice',
    category: 'brand-voice',
    title: 'Train your Brand Voice in 30 minutes',
    subtitle:
      'The three fields that actually matter + 20 real-world examples of each, copy-pasteable.',
    description:
      'A working guide to filling out Brand Voice with text the AI can actually act on. Includes 20 tone examples, 15 avoid-lists, and 10 example hooks across creator niches.',
    emoji: '🎙️',
    readTimeMinutes: 12,
    difficulty: 'beginner',
    updatedAt: '2026-04-22',
    relatedGuides: ['your-first-24-hours-with-clipflow', 'hook-formulas-that-convert'],
    sections: [
      {
        id: 'why-it-matters',
        title: 'Why Brand Voice is the feature that compounds',
        content: [
          {
            type: 'paragraph',
            text: 'Brand Voice is the difference between AI output you edit every time and AI output you ship. It is also what makes Clipflow sound different on every account — without it, we would be a template bank wearing different skins.',
          },
          {
            type: 'paragraph',
            text: 'The trap: most users open Brand Voice, type "friendly and professional", hit save, and expect the magic. The AI cannot act on adjectives. It needs specific instructions — ideally with example phrasings. Spend 30 minutes on this once, save 30 minutes per post forever.',
          },
          {
            type: 'visual',
            visual: 'brand-voice',
          },
        ],
      },
      {
        id: 'the-four-fields',
        title: 'The four fields — what each one does',
        content: [
          {
            type: 'paragraph',
            text: 'Settings → Brand Voice has four fields. Voice name is a label for internal reference (leave as "Default" unless you run multiple voices). The other three are the calibration signals the AI actually acts on.',
          },
          {
            type: 'heading',
            level: 3,
            text: 'Field 1 — Voice name',
          },
          {
            type: 'paragraph',
            text: 'A label. Used when you run multiple brand voices (agencies do this per client). Solo creators: leave as "Default" and move on.',
          },
          {
            type: 'heading',
            level: 3,
            text: 'Field 2 — Tone & style',
          },
          {
            type: 'paragraph',
            text: 'The most important field. Describe how you actually sound, with specifics. The in-app placeholder ("casual, witty, direct, educational, hype-free...") gives the format — take it as a starting list, then expand with 3-5 mechanical choices.',
          },
          {
            type: 'example-box',
            label: 'Tone & style — the right way',
            good:
              'casual, direct, hype-free. I write in first person and use contractions. My sentences are short, often under 10 words. I use em-dashes instead of commas for emphasis. I never start sentences with "So," — it reads as filler. I end short-form posts with a specific action ("try this next week") not a question ("thoughts?").',
            bad:
              'Friendly but authoritative. Approachable. Confident. Authentic to my audience.',
          },
          {
            type: 'heading',
            level: 3,
            text: 'Field 3 — Words / patterns to avoid',
          },
          {
            type: 'paragraph',
            text: 'The AI has default patterns — overused words and filler constructions it reaches for when unsure. This field kills those patterns for your account specifically. Be specific; generic bans do nothing. The in-app placeholder ("jargon, passive voice, emojis, overly salesy language") is a hint, not a full list — expand it.',
          },
          {
            type: 'example-box',
            label: 'Words / patterns to avoid — the right way',
            good:
              '"leverage" as a verb, "unlock", "game-changer", "actionable insights", "synergy", "deep-dive", "crush it", any sentence starting with "In today\u2019s fast-paced", engagement-bait questions ending in "thoughts?"',
            bad: 'Corporate speak, buzzwords, clichés.',
          },
          {
            type: 'heading',
            level: 3,
            text: 'Field 4 — Example hook',
          },
          {
            type: 'paragraph',
            text: 'One actual hook from your published content that landed. This is the calibration signal — the AI uses it to match rhythm, sentence length, hook style. Pick your best-performing real hook, not a fantasy one. The in-app placeholder ("I spent 90 days doing X — here\u2019s what nobody tells you about Y...") shows the shape we\u2019re looking for.',
          },
          {
            type: 'example-box',
            label: 'Example hook — the right way',
            good:
              'I burned $47K on my first SaaS before I figured out what nobody tells you about pricing.',
            bad: 'Something catchy that grabs attention.',
          },
        ],
      },
      {
        id: 'tone-examples',
        title: '20 tone examples, by creator type',
        content: [
          {
            type: 'paragraph',
            text: 'Pick the closest match, edit to fit. These are starting points — personalize them before shipping.',
          },
          {
            type: 'heading',
            level: 4,
            text: 'Solo creators / Influencers',
          },
          {
            type: 'dos-donts',
            dos: [
              'First-person, contractions, audience-direct ("you")',
              'Curiosity-gap openers over stat-drops',
              'Short sentences — under 10 words where possible',
              'End with a specific action, not "what do you think?"',
              'Use em-dashes for pacing instead of commas',
            ],
            donts: [
              'Third-person narrator ("creators often...")',
              'Professional-formal tone — it reads as distant',
              'Engagement-bait questions',
              'Emoji-heavy CTAs',
              'Starting sentences with "So,"',
            ],
          },
          {
            type: 'heading',
            level: 4,
            text: 'B2B / SaaS founders',
          },
          {
            type: 'dos-donts',
            dos: [
              'Specific numbers (revenue, user counts, timelines)',
              'Company names — yours and others',
              'Story-driven: "I / we built X and learned Y"',
              'Concrete moments, not generalized wisdom',
              'Second-person on LinkedIn, first-person on shorts',
            ],
            donts: [
              '"Leverage" as a verb, "unlock", "synergy"',
              'Vague "entrepreneurs must..." framings',
              'Hustle-culture language',
              'Guru-voice — "12 hard truths about..."',
              'Industry buzzwords without specific anchoring',
            ],
          },
          {
            type: 'heading',
            level: 4,
            text: 'Coaches / Consultants',
          },
          {
            type: 'dos-donts',
            dos: [
              'Framework-first — named concepts over vague observations',
              'Contrarian angles: "the thing nobody tells you about X"',
              'Numbered lists for teaching',
              'End with a concrete action, not a question',
              'Authoritative, not performative',
            ],
            donts: [
              'Engagement questions ("what resonated most?")',
              'Testimonial-style bragging',
              'Filler intros ("as a coach for 10+ years...")',
              'Emoji-heavy copy',
              'Generic motivational language',
            ],
          },
          {
            type: 'heading',
            level: 4,
            text: 'Podcasters',
          },
          {
            type: 'dos-donts',
            dos: [
              'Quote the host with em-dash attribution',
              'Surface ONE insight per clip, not three',
              'Soft CTA back to the full episode ("full conversation at the link")',
              'Reference the guest by name + role',
              'Preserve actual podcast phrasing where strong',
            ],
            donts: [
              'Summary-style captions (reads as a content mill)',
              'Selling the subscribe button',
              'Overly dense context-setting',
              'Breaking the conversation frame',
              'Adding takeaways the host never said',
            ],
          },
        ],
      },
      {
        id: 'avoid-list-patterns',
        title: 'Avoid-list: the 15 words AI over-uses by default',
        content: [
          {
            type: 'paragraph',
            text: 'These show up in AI output until you explicitly ban them. Copy this list as a starting point, then add your personal triggers.',
          },
          {
            type: 'checklist',
            title: 'Common AI default patterns (ban these)',
            items: [
              '"leverage" as a verb — almost always replaceable with "use"',
              '"unlock" — overused to the point of meaninglessness',
              '"game-changer" / "game-changing"',
              '"actionable insights" — means nothing',
              '"synergy" / "synergize"',
              '"deep-dive" as a verb',
              '"at the end of the day"',
              '"moving forward" / "going forward"',
              '"low-hanging fruit"',
              '"circle back"',
              '"ecosystem" (when the thing is not an ecosystem)',
              '"streamline" without a specific before/after metric',
              '"empower" — applied to nouns that cannot be empowered',
              '"disrupt" / "disruptive"',
              '"mindset" — when used to avoid specific advice',
            ],
          },
          {
            type: 'callout',
            variant: 'pro',
            title: 'Add your niche\u2019s filler words',
            body: 'Every niche has a local filler vocabulary. Fitness: "crush your goals". SaaS: "move the needle". Coaches: "show up for yourself". Your audience hears these words from every other account. Add yours to the list so your posts do not blur into the noise.',
          },
        ],
      },
      {
        id: 'testing-it-works',
        title: 'Testing that your Brand Voice actually works',
        content: [
          {
            type: 'paragraph',
            text: 'After saving, run this test: go to an existing draft, click Regenerate. Read the output. Three signals it is working:',
          },
          {
            type: 'checklist',
            items: [
              'You can tell it is yours within the first sentence (not "sounds like a tool")',
              'Zero instances of the words you put in the avoid-list',
              'The rhythm matches your example hook (similar sentence length / cadence)',
            ],
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'If it still sounds generic:',
            body: 'Your Tone field is too vague. Rewrite it with 3+ specific mechanical choices (where you put em-dashes, how long your sentences are, what you NEVER start sentences with). "Friendly and professional" is not a tone — it is a personality trait.',
          },
        ],
      },
      {
        id: 'when-to-update',
        title: 'When to update your Brand Voice',
        content: [
          {
            type: 'paragraph',
            text: 'Your voice evolves. So should the settings. Update Brand Voice when one of these triggers:',
          },
          {
            type: 'steps',
            items: [
              {
                title: 'A new hook pattern is outperforming',
                body: 'If your last 5 top posts opened differently than your example hook, swap it in. The Brand Voice calibration follows performance, not hope.',
              },
              {
                title: 'You catch a filler word slipping through',
                body: 'Every time you edit AI output to remove a specific word, add that word to the avoid-list. Five updates and the AI never types it again.',
              },
              {
                title: 'Your audience changed',
                body: 'Pivoted niches? New target ICP? Full Brand Voice rewrite, then bulk-regenerate every existing draft against the new voice.',
              },
            ],
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Bulk-regenerate on voice change',
            body: 'After updating Brand Voice, jump to step 5 (Approve) on the workflow stepper, select all unpublished drafts, click Regenerate. Every pending post gets refreshed against the new voice in one shot. This is the move that saves agencies hours per client.',
          },
        ],
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────
   * 3. 7-day podcast publishing workflow
   * ────────────────────────────────────────────────────────────── */
  {
    id: 'seven-day-podcast-workflow',
    slug: '7-day-podcast-publishing-workflow',
    category: 'workflows',
    title: 'The 7-day podcast publishing workflow',
    subtitle:
      'One 45-minute episode → 20+ scheduled posts across 4 platforms, with a day-by-day breakdown.',
    description:
      'End-to-end repurposing workflow for podcasters: from feed subscription to scheduled week. Includes time budgets per step and the three failure modes most podcasters hit.',
    emoji: '🎙️',
    readTimeMinutes: 10,
    difficulty: 'intermediate',
    updatedAt: '2026-04-22',
    relatedGuides: ['train-your-brand-voice', 'hook-formulas-that-convert'],
    sections: [
      {
        id: 'the-big-picture',
        title: 'The big picture',
        content: [
          {
            type: 'paragraph',
            text: 'A 45-minute podcast episode contains roughly 15-25 clip-worthy moments. Most podcasters post the "trailer" on release day and never touch the rest. This workflow closes that gap — one episode becomes a scheduled week of cross-platform content in under two hours of hands-on time.',
          },
          {
            type: 'visual',
            visual: 'rss-flow',
          },
          {
            type: 'callout',
            variant: 'info',
            body: 'Time budget: 20 minutes set-up on Day 0, roughly 15 minutes per episode thereafter. The workflow gets faster each week as Brand Voice learns your style.',
          },
        ],
      },
      {
        id: 'day-0',
        title: 'Day 0 — One-time setup (20 min)',
        content: [
          {
            type: 'steps',
            items: [
              {
                title: 'Connect your AI key (2 min)',
                body: 'Settings → AI Keys → Connect OpenAI / Anthropic / Google. Any one works.',
              },
              {
                title: 'Subscribe to your podcast RSS feed (3 min)',
                body: 'Open Workflow → Step 1 (Import). Paste your feed URL into the Smart-Import box — Clipflow auto-detects RSS. Check "Auto-import new episodes". Clipflow polls daily at 6 AM UTC — new episodes land as content automatically.',
                tip: 'Find your RSS URL in your podcast host settings. Transistor / Buzzsprout / Simplecast all surface it prominently. Apple Podcasts URLs do not work — you need the raw feed.',
              },
              {
                title: 'Train Brand Voice for podcast format (10 min)',
                body: 'Settings → Brand Voice. Use the Podcaster preset as a starting point: quote-forward, em-dash attribution, soft CTA back to the full episode. Then personalize.',
              },
              {
                title: 'Set niche preset (30 seconds)',
                body: 'Settings → Templates → Niche presets → Podcaster. This is the thing most users skip that compounds into better hooks on every future clip.',
              },
              {
                title: 'Connect Upload-Post (5 min)',
                body: 'Settings → Channels → Upload-Post. Free tier covers 10 posts/month — enough to test the full workflow. Upgrade later if you scale past it.',
              },
            ],
          },
        ],
      },
      {
        id: 'day-1',
        title: 'Day 1 — Episode drops (5 min)',
        content: [
          {
            type: 'paragraph',
            text: 'Your RSS subscription auto-imports the new episode overnight. You wake up to a content item already in Ready state — transcript fetched, metadata tagged. No action required.',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Manual trigger if you cannot wait',
            body: 'If the episode drops mid-day and you want to start immediately, hit the RSS import action manually. Same result, just on your schedule instead of the daily cron.',
          },
          {
            type: 'paragraph',
            text: 'Open the episode in your library. Click "Find clips" to run the Clip Finder. You will get 8-14 ranked clips in about 30 seconds, each with a 0-100 virality score and a plain-English explanation of why it works.',
          },
        ],
      },
      {
        id: 'day-2',
        title: 'Day 2 — Pick your three (15 min)',
        content: [
          {
            type: 'paragraph',
            text: 'Review the clip list. Filter to FIRE bucket (score 90+) first — these are your anchors. Pick the three you would publish if you could only publish three. Ignore everything below STRONG for now.',
          },
          {
            type: 'visual',
            visual: 'clip-finder',
          },
          {
            type: 'callout',
            variant: 'pro',
            title: 'The three-clip rule',
            body: 'Podcasters who post every clip the AI surfaces train their audience to scroll past. Three strong clips per episode beats eight mediocre ones every time.',
          },
          {
            type: 'paragraph',
            text: 'For each of your three, click Generate drafts. Clipflow writes TikTok + Instagram + YouTube Shorts + LinkedIn captions for each clip, in your Brand Voice.',
          },
        ],
      },
      {
        id: 'day-3',
        title: 'Day 3 — A/B test hooks for the best clip (10 min)',
        content: [
          {
            type: 'paragraph',
            text: 'Take your best clip (highest virality score). Open the A/B Hook Testing panel. Clipflow generates three alternative hooks — each using a different psychological lever. Pick the one that lands hardest for your audience.',
          },
          {
            type: 'visual',
            visual: 'hook-test',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Trust the contrarian variant',
            body: 'Over time, contrarian-lever hooks outperform curiosity and emotional levers for podcast clips by a solid margin. When in doubt on a clip that feels mid, ship the contrarian hook.',
          },
        ],
      },
      {
        id: 'day-4',
        title: 'Day 4 — Render + thumbnail (15 min)',
        content: [
          {
            type: 'paragraph',
            text: 'For each approved draft, hit Render MP4. Clipflow produces a vertical 9:16 video with burned-in subtitles, your brand kit applied (logo, color, intro/outro), and the hook highlighted. Shotstack renders take 2-4 minutes each; you can queue all three in parallel.',
          },
          {
            type: 'paragraph',
            text: 'While renders run, generate a YouTube thumbnail via Thumbnail Studio. One per clip, branded with your podcast\u2019s accent color.',
          },
        ],
      },
      {
        id: 'day-5',
        title: 'Day 5 — Schedule the week (10 min)',
        content: [
          {
            type: 'paragraph',
            text: 'Click step 6 (Schedule) on the workflow stepper. Drag your three approved drafts onto the calendar — each one across multiple platforms. Suggested cadence for podcasters:',
          },
          {
            type: 'visual',
            visual: 'schedule',
          },
          {
            type: 'dos-donts',
            dos: [
              'Tuesday 9am — Clip 1 hits TikTok + Reels + Shorts',
              'Wednesday 12pm — LinkedIn takeaway from the full episode',
              'Thursday 9am — Clip 2 hits TikTok + Reels + Shorts',
              'Friday 9am — Clip 3 on LinkedIn (the "expert" clip)',
              'Saturday — rest day, let the algo breathe',
            ],
            donts: [
              'Do not bulk-publish all three clips on release day',
              'Do not schedule LinkedIn posts for weekends — dead audience',
              'Do not use identical captions across platforms (Clipflow avoids this automatically)',
              'Do not over-tag the guest on every post — save the tags for the strongest',
              'Do not forget to manually boost the best-performing clip after 24h of data',
            ],
          },
        ],
      },
      {
        id: 'days-6-7',
        title: 'Days 6-7 — Review + feed the loop',
        content: [
          {
            type: 'paragraph',
            text: 'Open Dashboard (Insights). See which clip is outperforming. Grab the hook of the winning clip and paste it as your new example hook in Brand Voice. This is the feedback loop that compounds weekly — every episode makes the next one sharper.',
          },
          {
            type: 'callout',
            variant: 'pro',
            title: 'The weekly review ritual (5 min)',
            body: 'Every Friday: open Dashboard, sort by engagement, find the #1 post. Update Brand Voice example hook with its opener. Next week\u2019s generations inherit what worked.',
          },
        ],
      },
      {
        id: 'failure-modes',
        title: 'Three ways this workflow breaks — and how to fix',
        content: [
          {
            type: 'heading',
            level: 3,
            text: 'Failure 1: RSS auto-import misses an episode',
          },
          {
            type: 'paragraph',
            text: 'Happens when the podcast host rebuilds the feed and changes all GUIDs. Clipflow sees every episode as "new" and caps the import at 5 to protect your quota.',
          },
          {
            type: 'callout',
            variant: 'warning',
            body: 'Fix: go to your library, delete the 5 auto-imported old episodes, and do a fresh RSS re-subscribe. The new guid becomes the high-water mark and daily polling resumes normally.',
          },
          {
            type: 'heading',
            level: 3,
            text: 'Failure 2: Captions sound generic even with Brand Voice set',
          },
          {
            type: 'paragraph',
            text: 'The Brand Voice fields are too vague. Adjectives ("friendly", "professional") do not give the AI mechanical instructions to act on.',
          },
          {
            type: 'callout',
            variant: 'warning',
            body: 'Fix: rewrite your Tone field with 3+ specific rules ("I never start sentences with So," "em-dashes not commas"). Then bulk-regenerate all drafts. See the Brand Voice guide for 20 concrete examples.',
          },
          {
            type: 'heading',
            level: 3,
            text: 'Failure 3: Clip Finder ranks the wrong moments',
          },
          {
            type: 'paragraph',
            text: 'Usually a transcript quality issue — ad reads, long pauses, and outro music skew the score.',
          },
          {
            type: 'callout',
            variant: 'warning',
            body: 'Fix: after Clip Finder runs, manually skip the top 2-3 highest-score clips if they look wrong, and trust the next batch. The scoring is strong on content quality but cannot tell an ad read from earnest content.',
          },
        ],
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────
   * 4. Hook formulas that actually convert
   * ────────────────────────────────────────────────────────────── */
  {
    id: 'hook-formulas-that-convert',
    slug: 'hook-formulas-that-convert',
    category: 'hooks-captions',
    title: 'Hook formulas that actually convert',
    subtitle:
      'Seven reusable hook structures, ranked by platform. What to steal, what to skip, what to test.',
    description:
      'Craft reference for short-form hooks: seven named structures, the psychological lever behind each, platform-specific performance, and copy-pasteable templates for each.',
    emoji: '🎯',
    readTimeMinutes: 9,
    difficulty: 'intermediate',
    updatedAt: '2026-04-22',
    relatedGuides: ['train-your-brand-voice', 'seven-day-podcast-workflow'],
    sections: [
      {
        id: 'why-hooks-matter',
        title: 'Why the hook is almost everything',
        content: [
          {
            type: 'paragraph',
            text: 'Short-form video watch-through correlates more strongly with the first 3 seconds than with any other single variable. You can have the best content, the best editing, and the best creator — if the hook is mid, the clip dies in the first 2 seconds.',
          },
          {
            type: 'quote',
            text: 'If your first line does not earn the next seven, you are posting trivia.',
          },
          {
            type: 'paragraph',
            text: 'The good news: hooks are a solved problem. There are roughly seven structures that reliably work across platforms. Mastering them is mostly a matter of pattern-recognition, not originality.',
          },
        ],
      },
      {
        id: 'the-seven-hooks',
        title: 'The seven hook structures',
        content: [
          {
            type: 'heading',
            level: 3,
            text: '1. Curiosity-gap',
          },
          {
            type: 'paragraph',
            text: 'Opens an information loop. The viewer is compelled to watch to close it.',
          },
          {
            type: 'example-box',
            label: 'Template',
            good:
              'There is one thing nobody tells you about [X] — and it is the reason [Y].',
          },
          {
            type: 'dos-donts',
            dos: [
              'Use when the payoff is genuinely valuable',
              'Best on TikTok and Instagram Reels',
              'Pairs well with pattern-interrupt visuals',
            ],
            donts: [
              'Do not over-promise — "this will change your life" is dead',
              'Do not use if you cannot close the loop in 10 seconds',
              'Do not stack with a second curiosity gap — muddles the payoff',
            ],
          },
          {
            type: 'heading',
            level: 3,
            text: '2. Contrarian take',
          },
          {
            type: 'paragraph',
            text: 'Reverses a belief the audience holds. Creates narrative tension the viewer wants resolved.',
          },
          {
            type: 'example-box',
            label: 'Template',
            good: 'Stop [doing X]. Here is what actually works.',
          },
          {
            type: 'dos-donts',
            dos: [
              'Use on a belief your audience strongly holds',
              'Best on LinkedIn and Twitter-style shorts',
              'Pairs with credibility markers (numbers, specifics)',
            ],
            donts: [
              'Do not use if your take is not actually contrarian',
              'Do not make the contrarian part feel like clickbait',
              'Do not argue with a strawman',
            ],
          },
          {
            type: 'heading',
            level: 3,
            text: '3. Specific number',
          },
          {
            type: 'paragraph',
            text: 'Opens on a precise figure. The specificity reads as competence and buys attention.',
          },
          {
            type: 'example-box',
            label: 'Template',
            good:
              'I burned $47K on [X] before I figured out [Y].',
          },
          {
            type: 'dos-donts',
            dos: [
              'Always use the real number — not a rounded version',
              'Best on LinkedIn and YouTube Shorts',
              'Works especially well for founders / SaaS / ecom',
            ],
            donts: [
              'Do not use if the number is not yours — reads as stolen credibility',
              'Do not pair with "click here" CTAs — kills the tone',
              'Do not use small numbers where big ones exist',
            ],
          },
          {
            type: 'heading',
            level: 3,
            text: '4. Emotional hook',
          },
          {
            type: 'paragraph',
            text: 'Opens on a felt moment. Bypasses the rational filter — the viewer watches to see where the feeling goes.',
          },
          {
            type: 'example-box',
            label: 'Template',
            good:
              'I almost gave up on [X] last month. Here is what happened.',
          },
          {
            type: 'dos-donts',
            dos: [
              'Use for story clips, not lesson clips',
              'Best on TikTok, Reels, Instagram',
              'Must resolve emotionally, not just informationally',
            ],
            donts: [
              'Do not manufacture emotion — audience detects it',
              'Do not use for B2B contexts — reads as performative',
              'Do not leave the emotion hanging',
            ],
          },
          {
            type: 'heading',
            level: 3,
            text: '5. Pattern-interrupt',
          },
          {
            type: 'paragraph',
            text: 'Breaks the expected short-form opening. Forces the viewer to re-orient, which buys the next 2 seconds.',
          },
          {
            type: 'example-box',
            label: 'Template',
            good: '[unexpected statement]. Let me explain.',
          },
          {
            type: 'dos-donts',
            dos: [
              'Use sparingly — loses effect when over-used',
              'Best on TikTok',
              'Strong visual pattern-interrupt amplifies the verbal one',
            ],
            donts: [
              'Do not be random for the sake of random',
              'Do not use as a crutch for weak content',
              'Do not stack multiple pattern-interrupts',
            ],
          },
          {
            type: 'heading',
            level: 3,
            text: '6. Framework name',
          },
          {
            type: 'paragraph',
            text: 'Opens on a named concept. Positions you as the framework\u2019s owner — and the viewer stays to learn it.',
          },
          {
            type: 'example-box',
            label: 'Template',
            good:
              'The [X]-[Y] rule changed how I think about [Z]. Here is how it works.',
          },
          {
            type: 'dos-donts',
            dos: [
              'Best for coaches and consultants',
              'Best on LinkedIn + YouTube Shorts',
              'Own the framework — name it something memorable',
            ],
            donts: [
              'Do not use someone else\u2019s framework without attribution',
              'Do not name something trivial',
              'Do not stack two frameworks in one post',
            ],
          },
          {
            type: 'heading',
            level: 3,
            text: '7. Direct challenge',
          },
          {
            type: 'paragraph',
            text: 'Opens by challenging the viewer\u2019s current behavior. The viewer stays to defend themselves or to learn.',
          },
          {
            type: 'example-box',
            label: 'Template',
            good:
              'If you are [doing X], you are wasting your time. Here is why.',
          },
          {
            type: 'dos-donts',
            dos: [
              'Best for coaches and experts',
              'Strong on TikTok and LinkedIn',
              'Back it up with specific evidence',
            ],
            donts: [
              'Do not use if you cannot defend the challenge',
              'Do not shame the viewer',
              'Do not generalize to "everyone is"',
            ],
          },
        ],
      },
      {
        id: 'ab-test-strategy',
        title: 'How to A/B test hooks using Clipflow',
        content: [
          {
            type: 'paragraph',
            text: 'Clipflow generates three hook variants per draft, each using a different structure. The A/B Hook Testing panel picks one as the winner and tracks it. Over time you build data on which structures actually work for YOUR audience.',
          },
          {
            type: 'visual',
            visual: 'hook-test',
          },
          {
            type: 'steps',
            items: [
              {
                title: 'Open a draft and click A/B Hooks',
                body: 'Clipflow generates three variants. Read all three before picking.',
              },
              {
                title: 'Pick the strongest opener for THIS clip',
                body: 'Not your favorite structure in general — the one that best matches this specific content.',
              },
              {
                title: 'Mark it as winner + ship it',
                body: 'Clipflow stores the winner against the draft so you can trace back performance to the hook structure used.',
              },
              {
                title: 'After 5-10 posts, review patterns',
                body: 'Open Dashboard, sort by engagement. Which hook structures show up most? Bias future generations toward those.',
              },
            ],
          },
        ],
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────
   * 5. Onboard an agency client in 15 minutes
   * ────────────────────────────────────────────────────────────── */
  {
    id: 'onboard-agency-client',
    slug: 'onboard-an-agency-client-in-15-minutes',
    category: 'agency',
    title: 'Onboard a new agency client in 15 minutes',
    subtitle:
      'The exact Studio-plan workflow that takes a new client from contract signed to first scheduled week.',
    description:
      'Step-by-step agency onboarding using Studio-plan features — separate workspaces, white-label review, team seats, audit log. Every minute budgeted, every failure mode flagged.',
    emoji: '🏢',
    readTimeMinutes: 11,
    difficulty: 'intermediate',
    updatedAt: '2026-04-22',
    relatedGuides: ['train-your-brand-voice', 'seven-day-podcast-workflow'],
    sections: [
      {
        id: 'the-goal',
        title: 'The goal: first approved draft within 48 hours of contract signing',
        content: [
          {
            type: 'paragraph',
            text: 'Agency clients judge you in the first week. If they wait five days for a first draft, they already regret the contract. This workflow gets your first on-brand draft in front of them within 48 hours of onboarding — which sets the pace for the relationship.',
          },
          {
            type: 'visual',
            visual: 'agency-flow',
          },
          {
            type: 'callout',
            variant: 'info',
            body: 'Requires Studio plan. Everything below uses unlimited client workspaces, team seats, white-label review links, and the audit log — none of which exist on Creator tier.',
          },
        ],
      },
      {
        id: 'step-1-workspace',
        title: 'Step 1 — Create a dedicated client workspace (2 min)',
        content: [
          {
            type: 'steps',
            items: [
              {
                title: 'Switch workspaces → New client workspace',
                body: 'Workspace switcher top-left. Every client gets their own workspace so content never leaks across accounts.',
              },
              {
                title: 'Name it "Client name — Content"',
                body: 'Use the client\u2019s actual brand name, not your internal code-name. Clients see the workspace name when they open review links.',
              },
              {
                title: 'Set type = Client',
                body: 'This tags the workspace correctly in the Clients dashboard and enables per-client analytics rollup.',
              },
            ],
          },
        ],
      },
      {
        id: 'step-2-brand',
        title: 'Step 2 — Upload their Brand Kit (5 min)',
        content: [
          {
            type: 'paragraph',
            text: 'Settings → Brand Kit in the new workspace. Collect these assets from the client before the kickoff call — if they are late, onboarding slips. The six elements:',
          },
          {
            type: 'visual',
            visual: 'brand-kit',
          },
          {
            type: 'checklist',
            title: 'Collect before kickoff',
            items: [
              'Logo — PNG with transparent background, ideally SVG',
              'Accent color — hex value. Not a screenshot of their website.',
              'Display font — name + Google Fonts link or font file',
              'Intro card text — one line, max 40 characters',
              'Outro card text — one line, max 60 characters',
              'Watermark corner preference',
            ],
          },
          {
            type: 'callout',
            variant: 'pro',
            title: 'The client Brand Kit checklist',
            body: 'Make this a pre-kickoff requirement. Send clients a one-page "what we need before Day 1" with these six items. Clients who can\u2019t produce these fast will also be slow on approvals — that is useful early signal.',
          },
        ],
      },
      {
        id: 'step-3-voice',
        title: 'Step 3 — Train their Brand Voice (5 min)',
        content: [
          {
            type: 'paragraph',
            text: 'This is where most agencies fail. They skip Brand Voice and wonder why their output reads generic. Spend five minutes on this, save five hours a week on edits.',
          },
          {
            type: 'paragraph',
            text: 'Pull the client\u2019s three best-performing organic posts. Read them out loud. Extract: how they open, what words they use, what they never say, how they end. Translate that into the Tone field.',
          },
          {
            type: 'example-box',
            label: 'Tone field from a real agency client',
            good:
              'Writes in first person with short sentences — under 8 words often. Uses em-dashes for pacing. Never uses "leverage", "synergy", or any word ending in "-ize". Opens posts with a specific number or a contrarian claim, never with "In today\u2019s fast-paced world". Ends with a single concrete action, not a question.',
          },
          {
            type: 'paragraph',
            text: 'Set the niche preset in Settings → Templates (Coach / Podcaster / SaaS / etc.) so the platform templates get industry-correct tone layered on top.',
          },
        ],
      },
      {
        id: 'step-4-team',
        title: 'Step 4 — Invite team + assign roles (2 min)',
        content: [
          {
            type: 'paragraph',
            text: 'Workspace → Team. Add your internal team with the right role — and add the client as a reviewer if they want direct approval access.',
          },
          {
            type: 'dos-donts',
            dos: [
              'Assign Editor role to your copywriter + junior producer',
              'Assign Reviewer role to any internal QA before client',
              'Assign Client role (read + comment only) to 1-2 client-side stakeholders',
              'Keep Owner role for the agency lead + ops — nobody else',
              'Review audit log weekly to spot weird activity',
            ],
            donts: [
              'Do not make the client an Editor — breaks your QA gate',
              'Do not share one agency login across the team — breaks audit log',
              'Do not give full access to freelancers — Editor is enough',
              'Do not skip audit log review — you lose visibility fast on multi-client ops',
            ],
          },
        ],
      },
      {
        id: 'step-5-first-content',
        title: 'Step 5 — Import their first long-form (1 min)',
        content: [
          {
            type: 'paragraph',
            text: 'If they run a podcast, subscribe to the RSS feed with auto-import on. If they record Looms, have them share the link — upload MP4 into Clipflow. Whatever they record, get ONE long-form into the library on Day 1.',
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Do not start with a polished asset',
            body: 'First-week Clipflow output is noticeably better on rough long-form than on over-produced short-form. If the client insists on a polished promo video, generate drafts from it but warn them the voice will be off until you have more raw material.',
          },
        ],
      },
      {
        id: 'step-6-white-label',
        title: 'Step 6 — Turn on White-label Review (30 seconds)',
        content: [
          {
            type: 'paragraph',
            text: 'The single biggest agency-positioning win Clipflow gives you. When the client opens the review link, they see your agency\u2019s logo, color, and name — not Clipflow\u2019s.',
          },
          {
            type: 'visual',
            visual: 'review-link',
          },
          {
            type: 'paragraph',
            text: 'Settings → Workspace → turn on White-label review. Done. Every review link from this workspace now shows as your brand.',
          },
          {
            type: 'callout',
            variant: 'pro',
            title: 'The phrase that closes renewal',
            body: '"Your dashboard is branded with your logo, not ours" — use this line in the kickoff deck. Clients remember the visual consistency when they are deciding to renew. Most other tools cannot do this.',
          },
        ],
      },
      {
        id: 'step-7-send-first',
        title: 'Step 7 — Ship the first draft batch (within 48h)',
        content: [
          {
            type: 'steps',
            items: [
              {
                title: 'Generate drafts for the first long-form',
                body: '30 seconds. Four drafts across TikTok / Instagram / Shorts / LinkedIn, in the client\u2019s voice.',
              },
              {
                title: 'Internal review pass',
                body: 'Your team reviews on the Drafts board (workflow step 5 — Approve). Edit inline or regenerate single platforms that miss.',
              },
              {
                title: 'Move drafts to Approved',
                body: 'This is your internal QA gate — client never sees Draft-state content.',
              },
              {
                title: 'Create a white-label review link',
                body: 'Outputs panel → Review link → Create. Copy the URL. This is what you send the client — it is YOUR dashboard, not Clipflow.',
              },
              {
                title: 'Send the review link in your channel of choice',
                body: 'Email, Slack, WhatsApp — wherever the client expects to hear from you. Clients click, review, comment inline, approve or request changes.',
              },
              {
                title: 'Iterate until client-approved',
                body: 'Comments land back on your Drafts board (step 5). Address them, regenerate if needed, move to approved when done.',
              },
              {
                title: 'Schedule the week',
                body: 'Drag approved drafts onto the calendar. Set cadence. Upload-Post fires them at the scheduled time. Client sees live posts within the week.',
              },
            ],
          },
        ],
      },
      {
        id: 'scale-patterns',
        title: 'Patterns that scale from 1 to 10 clients',
        content: [
          {
            type: 'paragraph',
            text: 'The bottleneck that kills agency growth is not Clipflow — it is your ability to keep each client\u2019s voice distinct without duplicating setup work. Two patterns help:',
          },
          {
            type: 'heading',
            level: 3,
            text: 'Pattern 1: Templates per niche',
          },
          {
            type: 'paragraph',
            text: 'Create niche-specific custom templates in Settings → Templates. One for coaches, one for SaaS, one for ecom. When you onboard a new client, apply the template + niche preset + Brand Kit — you save 30 minutes per onboarding on prompt engineering.',
          },
          {
            type: 'heading',
            level: 3,
            text: 'Pattern 2: Audit log as QA layer',
          },
          {
            type: 'paragraph',
            text: 'Every Friday, open the audit log for each client workspace. Spot unusual activity — logins at odd hours, role changes, deleted drafts. Agencies with 5+ clients catch mistakes this way that would otherwise surface at renewal.',
          },
          {
            type: 'callout',
            variant: 'example',
            title: 'Real failure we have seen',
            body: 'Agency gave a junior producer Owner role on three clients. Producer left. Clients could not access their own content for 48 hours while the agency reset permissions. The audit log would have caught the role assignment immediately — weekly review prevents that.',
          },
        ],
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────
   * 6. YouTube to TikTok: the exact setup
   * ────────────────────────────────────────────────────────────── */
  {
    id: 'youtube-to-tiktok',
    slug: 'youtube-to-tiktok-the-exact-setup',
    category: 'workflows',
    title: 'YouTube to TikTok — the exact setup',
    subtitle:
      'Drop a YouTube URL into Clipflow, get a TikTok draft ready to post in under two minutes. Start-to-finish walkthrough.',
    description:
      'The simplest repurposing flow on Clipflow: one YouTube link in, one TikTok-ready draft out. Every step, every click, what to expect at each stage.',
    emoji: '📺',
    readTimeMinutes: 6,
    difficulty: 'beginner',
    updatedAt: '2026-04-22',
    relatedGuides: [
      'your-first-24-hours-with-clipflow',
      'train-your-brand-voice',
    ],
    sections: [
      {
        id: 'when-to-use',
        title: 'When this flow makes sense',
        content: [
          {
            type: 'paragraph',
            text: 'You have a YouTube long-form video — yours or from someone whose clips you are licensed to repurpose. You want one strong TikTok post out of it, fast. Not a batch of 12 — just the single best moment, captioned and ready.',
          },
          {
            type: 'callout',
            variant: 'info',
            body: 'Time budget: 2 minutes if the YouTube video has a transcript. Up to 10 minutes if Clipflow has to transcribe from scratch (we use Whisper).',
          },
        ],
      },
      {
        id: 'step-1-paste',
        title: 'Step 1 — Paste the YouTube URL (15 seconds)',
        content: [
          {
            type: 'steps',
            items: [
              {
                title: 'Open Workflow → Step 1 (Import)',
                body: 'Click "+ New content" top-left, or click step 1 on the workflow stepper. Either lands you on the Smart-Import box — one universal field, no tabs to pick.',
              },
              {
                title: 'Paste the YouTube URL',
                body: 'Drop the link straight into the Smart-Import field — both short (youtu.be) and long (youtube.com/watch) formats work. Clipflow auto-detects YouTube and switches to transcript-fetch mode.',
              },
              {
                title: 'Hit Import',
                body: 'Clipflow fetches the transcript via the YouTube API. No download. No waiting for video to upload. Transcript lands in roughly 5 seconds on a normal video.',
                tip: 'If the video has no captions / transcript, Clipflow falls back to Whisper transcription — which takes roughly one minute per 10 minutes of video. You get a progress indicator.',
              },
            ],
          },
        ],
      },
      {
        id: 'step-2-generate',
        title: 'Step 2 — Generate the TikTok draft (30 seconds)',
        content: [
          {
            type: 'paragraph',
            text: 'Once the content item flips to "Ready" state (transcript loaded), open it. You will see the transcript on the left and a big "Generate drafts" CTA on the right.',
          },
          {
            type: 'paragraph',
            text: 'Generate by default creates drafts for all four platforms (TikTok / Instagram / YouTube Shorts / LinkedIn). If you only want TikTok today, that is fine — just ignore the others or delete them afterward.',
          },
          {
            type: 'callout',
            variant: 'pro',
            title: 'Skip the clip finder on short videos',
            body: 'If the source YouTube is under 5 minutes, the Clip Finder is overkill. Click "Generate drafts" directly — it will write one caption per platform based on the full transcript.',
          },
        ],
      },
      {
        id: 'step-3-tiktok-draft',
        title: 'Step 3 — Review the TikTok draft specifically (1 minute)',
        content: [
          {
            type: 'paragraph',
            text: 'Click step 5 (Approve) on the workflow stepper to open the Drafts board. Your four drafts sit in the Draft column. Click the one tagged "TikTok" to open it.',
          },
          {
            type: 'dos-donts',
            dos: [
              'Read the hook out loud — does it earn the next 3 seconds?',
              'Check the caption length — TikTok reads roughly 150 characters before "more"',
              'Verify the hashtag set matches your niche (check the SEO panel)',
            ],
            donts: [
              'Do not edit the caption if the hook is strong — the rest is usually fine',
              'Do not ship without reviewing the first sentence',
              'Do not add emojis manually — Clipflow suggests a per-platform set if you want them',
            ],
          },
        ],
      },
      {
        id: 'step-4-hook-test',
        title: 'Step 4 — Run A/B Hook Testing (30 seconds)',
        content: [
          {
            type: 'paragraph',
            text: 'On the TikTok draft, scroll to the A/B Hooks section. Click "Generate variants." Clipflow produces three alternative openers — each one using a different psychological lever. Pick the one that lands hardest for your audience.',
          },
          {
            type: 'visual',
            visual: 'hook-test',
            caption:
              'Three hook variants per draft, picks a winner, stores it for later.',
          },
        ],
      },
      {
        id: 'step-5-ship',
        title: 'Step 5 — Approve + post',
        content: [
          {
            type: 'paragraph',
            text: 'Hit Approve on the draft. If Upload-Post is connected (Settings → Channels), click step 6 (Schedule) on the workflow stepper and drop it onto today\u2019s calendar slot. If not, click Export — you get a clean caption to paste into TikTok manually.',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Posting time matters more than polish',
            body: 'For TikTok, 9-11am and 7-10pm local time outperform everything else. Schedule for a peak window even if it means shipping the draft one day later.',
          },
        ],
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────
   * 7. Bulk-regenerate after a brand-voice update
   * ────────────────────────────────────────────────────────────── */
  {
    id: 'bulk-regenerate',
    slug: 'bulk-regenerate-after-brand-voice-update',
    category: 'brand-voice',
    title: 'Bulk-regenerate every draft after a Brand Voice update',
    subtitle:
      'The one-click move that saves agencies hours. Update voice once → refresh all pending drafts against the new calibration.',
    description:
      'How to use the bulk-regenerate action in the Drafts board to refresh existing drafts when you update the Brand Voice settings. Includes confirmation flow, partial-failure handling, and when NOT to use it.',
    emoji: '🔄',
    readTimeMinutes: 5,
    difficulty: 'intermediate',
    updatedAt: '2026-04-22',
    relatedGuides: ['train-your-brand-voice', 'your-first-24-hours-with-clipflow'],
    sections: [
      {
        id: 'why',
        title: 'Why this action exists',
        content: [
          {
            type: 'paragraph',
            text: 'You just rewrote your Brand Voice with 10 more specific tone choices. You have 23 pending drafts across the Draft / Review / Approved columns that were generated against the old voice. Manually regenerating each one would take an hour. Bulk-regenerate does it in one shot.',
          },
          {
            type: 'callout',
            variant: 'pro',
            title: 'The agency use case',
            body: 'Agencies running 5 clients often update one client\u2019s Brand Voice mid-week (after a client says "this does not sound like us"). Bulk-regenerate refreshes every pending draft for that client in under a minute — no other tool in this category has this.',
          },
        ],
      },
      {
        id: 'the-flow',
        title: 'The exact flow',
        content: [
          {
            type: 'steps',
            items: [
              {
                title: 'Update your Brand Voice first',
                body: 'Settings → Brand Voice. Make your changes. Click Save. Verify the update landed (the "Default" label updates).',
                tip: 'Rewrite Tone & style if the output is reading generic. Update Example hook if your last 5 top posts opened differently than the current one. Add to the avoid-list every time you catch a filler word in output.',
              },
              {
                title: 'Go to the Drafts board',
                body: 'Click step 5 (Approve) on the workflow stepper. You will see the Drafts board with Draft / Review / Approved / Exported columns. The stepper is clickable from anywhere — you do not need to walk through Steps 1-4 to land here.',
              },
              {
                title: 'Select the drafts you want refreshed',
                body: 'Click the checkbox on each card. You can select across columns — bulk-regenerate works on any draft regardless of state.',
                tip: 'Use the column-header "Select all in this column" to grab every Draft + Review card in one click. Skip Approved + Exported drafts unless you want to re-review them.',
              },
              {
                title: 'Click Regenerate in the bulk-action bar',
                body: 'A floating action bar appears at the bottom once 1+ drafts are selected. Click the Regenerate icon (the rotating arrow). A confirmation prompt asks "Regenerate N drafts? Existing captions will be replaced."',
              },
              {
                title: 'Confirm + wait',
                body: 'Clipflow regenerates each draft sequentially (not in parallel — respects AI provider rate limits). You see a progress indicator per draft. For 20 drafts, expect ~60 seconds.',
              },
              {
                title: 'Review the refreshed drafts',
                body: 'When complete, the cards auto-refresh with the new captions. Spot-check 3-4 to verify the voice change took. If output still reads generic, the Brand Voice update was too vague — iterate.',
              },
            ],
          },
        ],
      },
      {
        id: 'failure-modes',
        title: 'When some regenerations fail',
        content: [
          {
            type: 'paragraph',
            text: 'Bulk-regenerate returns partial success. If 18 of 20 succeeded and 2 failed, the toast will say so: "Regenerated 18, but 2 failed: <reason>."',
          },
          {
            type: 'checklist',
            title: 'Common failure reasons',
            items: [
              'AI provider rate-limited (retry in 1 minute)',
              'Source content item was deleted (nothing to regenerate from)',
              'Transcript is empty (content item never finished processing)',
              'AI provider key was removed / rotated (re-add in Settings → AI Keys)',
            ],
          },
        ],
      },
      {
        id: 'when-not',
        title: 'When NOT to bulk-regenerate',
        content: [
          {
            type: 'dos-donts',
            dos: [
              'After a meaningful Brand Voice update',
              'After switching niche preset (Creator → Coach, etc.)',
              'After updating the custom template for a platform',
              'When onboarding a new client — refresh their sample drafts against their voice',
            ],
            donts: [
              'Do not bulk-regenerate drafts you have already edited by hand — you will lose the edits',
              'Do not bulk-regenerate Approved or Exported drafts unless you specifically want a redo',
              'Do not run bulk-regenerate on 100+ drafts — split into batches to avoid AI rate limits',
              'Do not bulk-regenerate just to get "new output" — voice has not changed, neither will output',
            ],
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'One-way operation',
            body: 'Bulk-regenerate replaces the existing caption — the old one is gone. If you had hand-edits you wanted to keep, export them first or skip the regenerate for those specific cards.',
          },
        ],
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────
   * 8. Find viral moments in a long recording
   * ────────────────────────────────────────────────────────────── */
  {
    id: 'find-viral-moments',
    slug: 'find-viral-moments-in-2-minutes',
    category: 'workflows',
    title: 'Find viral moments in a long recording — 2 minutes end-to-end',
    subtitle: 'From 60-minute podcast to 5 ranked clips with hooks, captions, and a ready-to-post MP4.',
    description: 'Walkthrough of the Viral Moments feature — upload, detect, preview, render, publish. Covers what the virality score actually means, how to tune the crop when the speaker is off-center, and when to skip a clip even if the AI ranked it high.',
    emoji: '\u2728',
    readTimeMinutes: 6,
    difficulty: 'beginner',
    updatedAt: '2026-04-22',
    relatedGuides: ['first-24-hours', 'hook-formulas-that-convert', 'train-your-brand-voice'],
    sections: [
      {
        id: 'when-to-use',
        title: 'When Viral Moments beats Clip Finder alone',
        content: [
          {
            type: 'paragraph',
            text: 'Clip Finder scores every clip-worthy segment in your transcript and gives you a list. Viral Moments is the same detection engine plus a full render pipeline \u2014 one click produces a 9:16 MP4 with karaoke captions, a hook overlay in the first 2.5 seconds, and optional direct-publish to TikTok / Reels / Shorts / LinkedIn via your Upload-Post key.',
          },
          {
            type: 'paragraph',
            text: 'Use Viral Moments when you want clips you can actually post today. Use Clip Finder standalone when you only need to research what IS in the recording, without committing render credits.',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'The single-button mental model',
            body: 'Upload \u2192 Find viral moments \u2192 Render the ones you like \u2192 Post. Four buttons. Everything else is polish you add when you care (caption style, crop override, hook-text edits).',
          },
        ],
      },
      {
        id: 'step-1-upload',
        title: 'Step 1 \u2014 Import a long-form recording',
        content: [
          {
            type: 'paragraph',
            text: 'Viral Moments needs a transcript. The content item has to be in the `ready` state with a transcript of at least 200 characters. Any of the four import methods work \u2014 YouTube URL, direct upload, podcast RSS, or paste-a-script.',
          },
          {
            type: 'steps',
            items: [
              { title: 'Open Step 1 (Import)', body: 'Click + New content top-left, or click step 1 on the workflow stepper. Either lands you on the Smart-Import box.' },
              { title: 'Paste or drop the source', body: 'Smart-Import auto-detects what you give it: YouTube link, MP4/MP3 upload, podcast RSS, or pasted script. Skip text-only if you want to render.' },
              { title: 'Wait for Ready', body: 'Status badge flips from Processing to Ready once Whisper finishes. Usually 30\u2013120 seconds depending on length.' },
              { title: 'Open the content detail page', body: 'The Highlights button lives in the Tools tab and on the workspace home for any item already in the Ready state.' },
            ],
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Text-only imports work, but rendering does not',
            body: 'If you pasted a script instead of uploading video/audio, Viral Moments can still detect the best moments \u2014 but there is no source file to render from. You can use the clips as caption templates, or re-import the video when you have it.',
          },
        ],
      },
      {
        id: 'step-2-detect',
        title: 'Step 2 \u2014 Run "Find viral moments"',
        content: [
          {
            type: 'paragraph',
            text: 'From the content page, open the Tools tab and click the Viral Moments card \u2014 or hit the CTA directly from the workspace home. The detection runs for 10\u201330 seconds, then drops 3\u20138 ranked clips in the Highlights view.',
          },
          {
            type: 'paragraph',
            text: 'Each card shows: a virality score (0\u2013100, color-coded \u2014 green \u226580, amber \u226560, grey below), the time range, a punchy hook line, and a one-sentence reason. The scoring prompt weighs four things, in this order:',
          },
          {
            type: 'dos-donts',
            dos: [
              'Hook strength (40%) \u2014 the first 2 seconds pulling the next 58',
              'Emotional peak (30%) \u2014 is there a moment worth remembering?',
              'Quotability (20%) \u2014 can the line stand alone as a caption?',
              'Pacing (10%) \u2014 does it end clean, not mid-thought?',
            ],
            donts: [
              'The score is NOT a view-count prediction \u2014 no AI can do that honestly',
              'Do not treat it as absolute \u2014 a 68 on your channel might outperform an 89 on mine',
              'Do not render every clip blindly \u2014 triage first, render second',
            ],
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Transparent by design',
            body: 'Every card shows its reason in plain English. If the AI says "ends on a clean punchline" and you listen and it does not, the score is wrong. Delete it. The transparency is the point.',
          },
        ],
      },
      {
        id: 'step-3-preview',
        title: 'Step 3 \u2014 Preview and adjust before rendering',
        content: [
          {
            type: 'paragraph',
            text: 'Click "Preview & adjust" on any draft card. This opens the source video in a modal with four controls:',
          },
          {
            type: 'steps',
            items: [
              { title: 'Timeline handles', body: 'Drag the start / end handles on the scrubber to tune the clip bounds. The preview plays the new range instantly.' },
              { title: 'Crop guide', body: 'The lime-bordered 9:16 window overlays the 16:9 source. Drag it horizontally when the speaker sits off-center.' },
              { title: 'Hook overlay', body: 'The first 2.5 seconds of the rendered clip burn in this text. Edit it directly in the modal before rendering.' },
              { title: 'Caption style', body: 'Pick one of four styles: TikTok Bold, Minimal, Neon Yellow, or White Bar. Each renders instantly on preview.' },
            ],
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Render credits are cheap, but not free',
            body: 'Each render goes through Shotstack and costs \u224c$0.02 on your BYOK quota. Tuning bounds + crop in the preview costs nothing. Spend the 20 seconds on the preview \u2014 cheaper than re-rendering a mis-cropped clip.',
          },
        ],
      },
      {
        id: 'step-4-render',
        title: 'Step 4 \u2014 Render (single or batch)',
        content: [
          {
            type: 'paragraph',
            text: 'Click "Render clip" on any card. The status flips to "Rendering" and polls every 8 seconds. Typical render is 30\u201390 seconds end-to-end. Once ready, the card shows the MP4 inline (with its poster thumbnail) and a Download link.',
          },
          {
            type: 'paragraph',
            text: 'Have 5+ drafts? A "Render all" banner shows at the top \u2014 one click submits every draft sequentially. Studio plan users get priority queue through Shotstack automatically.',
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Rendering is one-way',
            body: 'Once a clip has rendered, Preview & Adjust is locked. That is by design \u2014 the bounds, crop, and hook are burned into the MP4. If you want to change them, delete the card and re-detect.',
          },
        ],
      },
      {
        id: 'step-5-post',
        title: 'Step 5 \u2014 Post directly (optional)',
        content: [
          {
            type: 'paragraph',
            text: 'Each ready card has a Post button. Click it, the platform-picker opens \u2014 by default TikTok / Instagram / YouTube are checked. Edit the caption (defaults to the hook text), pick platforms, hit Post now. Upload-Post handles the per-platform OAuth \u2014 you only hold their key.',
          },
          {
            type: 'paragraph',
            text: 'Alternatively: download the MP4 and post manually if you want human-in-the-loop before going live. Both flows work from the same card.',
          },
        ],
      },
    ],
  },
]

export const ALL_GUIDE_IDS = GUIDES.map((g) => g.id)
