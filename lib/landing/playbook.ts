import type { Guide, GuideCategory, GuideCategoryId } from './playbook-types'

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
            text: 'Click the + New content button top-left. You have four import paths: upload MP4, paste YouTube link, paste RSS feed URL, or paste plain text. Pick whichever matches your source.',
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
                body: 'Sidebar → Drafts. Four fresh drafts ready for review. Each card shows the caption, platform, and a virality-like ranking signal.',
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
            text: 'After saving, go back to Drafts, select all four drafts, and click Bulk regenerate. The new drafts will be noticeably closer to how you actually write. If they are not, the Brand Voice copy is too vague — rewrite it more specifically.',
          },
        ],
      },
      {
        id: 'step-5-approve',
        title: 'Step 5 — Review and approve (10 minutes)',
        content: [
          {
            type: 'paragraph',
            text: 'On the Drafts board, read each draft. Minor edit: click inline and retype. Major miss: click Regenerate for a single-platform retry. Happy with it: swipe it right to Approved.',
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
            text: 'If you have Upload-Post connected, go to Schedule, drag your Approved drafts onto the calendar, set a time, done. If not, click Export on each draft — you will get a clean caption + any rendered assets to paste into each platform manually.',
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
        id: 'the-three-fields',
        title: 'The three fields — what each one does',
        content: [
          {
            type: 'heading',
            level: 3,
            text: 'Field 1 — Tone of voice',
          },
          {
            type: 'paragraph',
            text: 'The most important field. Describe how you actually sound, with specifics. Length: aim for 3-5 sentences, each one a concrete mechanical choice, not a vibe.',
          },
          {
            type: 'example-box',
            label: 'Tone — the right way',
            good:
              'I write in first person and use contractions. My sentences are short, often under 10 words. I use em-dashes instead of commas for emphasis. I never start sentences with "So," — it reads as filler. I end short-form posts with a specific action ("try this next week") not a question ("thoughts?").',
            bad:
              'Friendly but authoritative. Approachable. Confident. Authentic to my audience.',
          },
          {
            type: 'heading',
            level: 3,
            text: 'Field 2 — Words to avoid',
          },
          {
            type: 'paragraph',
            text: 'The AI has default patterns — overused words and filler constructions it reaches for when unsure. This field kills those patterns for your account specifically. Be specific; generic bans do nothing.',
          },
          {
            type: 'example-box',
            label: 'Avoid-list — the right way',
            good:
              '"leverage" as a verb, "unlock", "game-changer", "actionable insights", "synergy", "deep-dive", "crush it", any sentence starting with "In today\u2019s fast-paced", engagement-bait questions ending in "thoughts?"',
            bad: 'Corporate speak, buzzwords, clichés.',
          },
          {
            type: 'heading',
            level: 3,
            text: 'Field 3 — Example hook',
          },
          {
            type: 'paragraph',
            text: 'One actual hook from your published content that landed. This is the calibration signal — the AI uses it to match rhythm, sentence length, hook style. Pick your best-performing real hook, not a fantasy one.',
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
            body: 'After updating Brand Voice, go to Drafts, select all unpublished drafts, click Regenerate. Every pending post gets refreshed against the new voice in one shot. This is the move that saves agencies hours per client.',
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
                body: 'Import content → RSS tab. Paste the feed URL. Check "Auto-import new episodes". Clipflow polls daily at 6 AM UTC — new episodes land as content automatically.',
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
            text: 'Open Schedule. Drag your three approved drafts onto the calendar — each one across multiple platforms. Suggested cadence for podcasters:',
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
            text: 'Open Analytics. See which clip is outperforming. Grab the hook of the winning clip and paste it as your new example hook in Brand Voice. This is the feedback loop that compounds weekly — every episode makes the next one sharper.',
          },
          {
            type: 'callout',
            variant: 'pro',
            title: 'The weekly review ritual (5 min)',
            body: 'Every Friday: open Analytics, sort by engagement, find the #1 post. Update Brand Voice example hook with its opener. Next week\u2019s generations inherit what worked.',
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
                body: 'Go to Analytics, sort by engagement. Which hook structures show up most? Bias future generations toward those.',
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
                body: 'Your team reviews in the Pipeline board. Edit inline or regenerate single platforms that miss.',
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
                body: 'Comments land back in your Pipeline board. Address them, regenerate if needed, move to approved when done.',
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
]

export const ALL_GUIDE_IDS = GUIDES.map((g) => g.id)
