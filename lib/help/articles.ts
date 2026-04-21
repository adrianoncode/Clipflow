/**
 * Help-center articles, keyed by URL slug.
 *
 * Kept in a single TypeScript file instead of a CMS or MDX directory
 * because at our scale (15 articles) the tradeoff favors simplicity:
 *   - no build-time content pipeline
 *   - every article is type-checked and reachable via grep
 *   - copy changes ship in a regular commit (reviewable, reversible)
 *
 * If we ever cross ~50 articles this becomes painful. At that point
 * swap for MDX — the data shape here is intentionally MDX-compatible
 * so the migration is straightforward.
 */

interface HelpArticle {
  title: string
  summary?: string
  /** Authored as raw HTML — we don't take user input here, only our
   * own strings, so it's safe. Keep tags simple: <p>, <ul>, <li>,
   * <strong>, <code>, <a>, <h2>, <h3>. */
  body: string
}

const SUPPORT_LINK =
  '<a href="mailto:support@clipflow.to">support@clipflow.to</a>'

export const HELP_ARTICLES: Record<string, HelpArticle> = {
  // ── Getting started ────────────────────────────────────────────────
  'getting-started': {
    title: 'What Clipflow does in 30 seconds',
    summary: 'The shortest possible explanation of the product.',
    body: `
<p>Clipflow turns one video into four platform-native posts — TikTok, Instagram Reels, YouTube Shorts, and LinkedIn — in about 30 seconds.</p>
<p>The workflow is:</p>
<ol>
  <li><strong>Import a video.</strong> Paste a YouTube link, upload an MP4, or drop in a text transcript.</li>
  <li><strong>Generate drafts.</strong> The AI writes four platform-specific captions using your brand voice.</li>
  <li><strong>Review &amp; approve.</strong> Tweak or regenerate anything you don&apos;t like.</li>
  <li><strong>Schedule.</strong> Drop approved drafts on a calendar and Clipflow posts them at the right times.</li>
</ol>
<p>You bring your own AI key (OpenAI, Anthropic, or Google) and pay your provider at cost — Clipflow adds zero markup on AI spend.</p>
    `,
  },

  'connect-ai-keys': {
    title: 'Connect your first AI provider',
    summary: 'OpenAI, Anthropic, or Google — any of the three works.',
    body: `
<p>Clipflow generates everything using <strong>your</strong> AI key. Pick whichever you already have:</p>
<ul>
  <li><strong>OpenAI</strong> (GPT-4o / GPT-5) — most popular, $5 free credit at signup</li>
  <li><strong>Anthropic</strong> (Claude) — strong on tone and voice</li>
  <li><strong>Google</strong> (Gemini) — generous free tier</li>
</ul>
<p>All three return identical output quality for our prompts. Go to <strong>Settings → AI Keys</strong>, click Connect next to a provider, paste your API key, done. Keys are encrypted at rest and never leave your workspace.</p>
    `,
  },

  'import-a-video': {
    title: 'Import your first video',
    summary: 'YouTube link, MP4 upload, or pasted text — all work.',
    body: `
<p>Click the purple <strong>+ New content</strong> button at the top of the sidebar.</p>
<p>The quickest path: paste a YouTube URL. Clipflow fetches the transcript via the YouTube API — no download needed, works in under 5 seconds.</p>
<p>Other options:</p>
<ul>
  <li><strong>Upload an MP4</strong> — up to 500MB per file. We transcribe with Whisper (~1 min per 10 min of audio).</li>
  <li><strong>Paste text</strong> — if you already have a transcript or an article, paste it and skip transcription entirely.</li>
  <li><strong>RSS / podcast feed</strong> — Clipflow can watch a feed and import new episodes automatically.</li>
</ul>
    `,
  },

  'generate-posts': {
    title: 'Generate platform-specific drafts',
    summary: 'Four platforms, one click, roughly 30 seconds.',
    body: `
<p>Once a video is in the &quot;Ready&quot; state (transcription finished), open it and click <strong>Generate</strong>.</p>
<p>You&apos;ll get four drafts:</p>
<ul>
  <li>TikTok — punchy hook, ~150 chars, heavy on rhythm</li>
  <li>Instagram Reels — similar tone, slightly longer caption</li>
  <li>YouTube Shorts — title + description tuned for discovery</li>
  <li>LinkedIn — professional tone, 1-2 paragraphs, real insights</li>
</ul>
<p>Every draft lands in the <strong>Drafts</strong> board in &quot;Draft&quot; state. From there you review, approve, and schedule.</p>
    `,
  },

  // ── Workflow ───────────────────────────────────────────────────────
  'approve-drafts': {
    title: 'Review and approve drafts',
    summary: 'The pipeline: Draft → Review → Approved → Exported.',
    body: `
<p>Every generated draft starts in the <strong>Draft</strong> column of the Drafts board.</p>
<p>Click any card to edit it inline. When you&apos;re happy, move it right: Review → Approved. Approved drafts are eligible for scheduling and publishing.</p>
<p>Bulk actions: check multiple cards and use the floating action bar at the bottom of the screen to approve or delete in one shot.</p>
    `,
  },

  'ab-hook-testing': {
    title: 'A/B test hooks before you publish',
    summary: 'Three variants, three psychological triggers, pick the winner.',
    body: `
<p>On any draft, open the <strong>A/B Hooks</strong> section. Clipflow generates three alternative hooks each using a different psychological lever — curiosity gap, contrarian take, emotional hook — and briefly explains why each might work.</p>
<p>Pick your favorite as the winner, regenerate if none feel right. Tested hooks ship alongside the draft when you schedule.</p>
    `,
  },

  'schedule-posts': {
    title: 'Schedule posts to go live automatically',
    summary: 'Calendar view, drag-and-drop, fires at the right time.',
    body: `
<p>Open <strong>Schedule</strong> in the sidebar. You&apos;ll see a calendar with all approved drafts on the left, waiting to be dropped onto a day.</p>
<p>Drag a draft onto a slot, set a time, done. If you&apos;ve connected Upload-Post (<strong>Settings → Channels</strong>), the post fires automatically at the scheduled time. Without Upload-Post, Clipflow still tracks the schedule but reminds you to post manually.</p>
    `,
  },

  'brand-voice': {
    title: 'Train the AI on your voice',
    summary: 'Paste five samples, get drafts that sound like you.',
    body: `
<p>Go to <strong>Settings → Brand Voice</strong>. Paste 3-5 examples of content you&apos;ve written before — LinkedIn posts, tweets, essay paragraphs. Length doesn&apos;t matter as long as they represent your real voice.</p>
<p>Clipflow extracts patterns — tone, sentence length, vocabulary, emoji usage — and applies them to every draft going forward. You can update the samples anytime; all new drafts use the latest voice.</p>
    `,
  },

  // ── Studio plan ────────────────────────────────────────────────────
  'add-client-workspace': {
    title: 'Add a client workspace',
    summary: 'One workspace per brand, clean separation.',
    body: `
<p>Studio plan unlocks unlimited workspaces — one per client. Every workspace has its own brand voice, content library, draft board, schedule, and analytics.</p>
<p>On the dashboard, click <strong>+ New client</strong> (the secondary button next to + New content). Give the client a name, hit Add. Switch between clients anytime using the workspace switcher in the top-left header.</p>
    `,
  },

  'invite-team': {
    title: 'Invite team members + set roles',
    summary: 'Three roles: editor, viewer, client-reviewer.',
    body: `
<p>In any workspace, go to <strong>Clients → Team</strong> in the sidebar and click Invite.</p>
<p>Enter the teammate&apos;s email, pick a role:</p>
<ul>
  <li><strong>Editor</strong> — full access to content, drafts, schedule</li>
  <li><strong>Viewer</strong> — read-only</li>
  <li><strong>Client-reviewer</strong> — can comment on drafts in a limited view</li>
</ul>
<p>They get an email with a one-click accept link. No Clipflow account needed upfront — they sign up from the invite itself.</p>
    `,
  },

  'client-review-links': {
    title: 'Share a review link with a client',
    summary: 'No-login external review for approvals.',
    body: `
<p>Open any content item on a Studio workspace and go to <strong>Share for review</strong>. Clipflow generates a unique link you can paste into email or Slack.</p>
<p>The client clicks it, sees the drafts, leaves comments — no Clipflow account required. You get notified in-app when they comment. Links can be set to expire, and you can revoke them anytime.</p>
    `,
  },

  // ── Billing & account ──────────────────────────────────────────────
  'plans-explained': {
    title: 'Creator vs. Studio: what changes',
    summary: 'Short answer: Studio is for people managing multiple brands.',
    body: `
<p><strong>Creator</strong> ($29/mo, $19/mo billed annually) — one workspace, up to 30 videos/month, full scheduling, A/B hook testing, creator research, B-roll, custom branding.</p>
<p><strong>Studio</strong> ($99/mo, $79/mo billed annually) — everything Creator has PLUS unlimited workspaces (one per client), team seats with roles, client review links with white-label, AI avatars, voice dubbing, priority renders.</p>
<p>Both include BYOK AI — you pay your provider at cost, Clipflow takes zero markup on AI spend.</p>
    `,
  },

  'cancel-subscription': {
    title: 'Cancel or pause your subscription',
    summary: 'Cancels at end of current billing period, no refunds for partial months.',
    body: `
<p>Go to <strong>Settings → Billing</strong> (or directly to /billing). Click <strong>Manage subscription</strong> — this opens the Stripe customer portal.</p>
<p>In the portal: cancel, change plan, update payment method, download invoices.</p>
<p>Cancelling keeps features active until the end of the current billing period. After that you drop to Free and can resubscribe anytime.</p>
    `,
  },

  'export-your-data': {
    title: 'Export all your data',
    summary: 'GDPR-compliant JSON download of everything we store.',
    body: `
<p>Go to <strong>Settings → Profile</strong> and click <strong>Download my data</strong>.</p>
<p>You&apos;ll get a single JSON file with: your profile, all workspaces you belong to, content items and transcripts, drafts, render history, schedule, subscription state, and referral history.</p>
<p>What&apos;s deliberately excluded: encrypted AI keys (useless to you in ciphertext), Stripe IDs (internal), OAuth tokens (security risk to hand over).</p>
<p>Rate limited to 3 exports per hour per user.</p>
    `,
  },

  'delete-account': {
    title: 'Delete your account',
    summary: 'Cannot be undone — export first.',
    body: `
<p>Go to <strong>Settings → Profile</strong>, scroll to the danger zone, click <strong>Delete my account</strong>. You&apos;ll be asked to type DELETE to confirm.</p>
<p>On delete:</p>
<ul>
  <li>Active Stripe subscriptions are cancelled immediately</li>
  <li>All workspaces you own are deleted (cascades through content, drafts, renders)</li>
  <li>Your profile and auth record are removed</li>
</ul>
<p><strong>Support cannot recover data after deletion.</strong> If you might come back, export your data first (see the card above the delete button).</p>
<p>Questions? ${SUPPORT_LINK}</p>
    `,
  },
}
