-- ===========================================================================
-- Content highlights — AI-detected viral clip candidates
-- ===========================================================================
-- The "Find Viral Moments" feature takes a long-form content item
-- (podcast / livestream / YouTube video) and asks GPT to pick 3–8
-- emotionally peaked 20–60 s segments worth clipping. Each segment
-- becomes a row here.
--
-- Lifecycle:
--   draft     — AI picked it, user hasn't rendered yet
--   rendering — Shotstack render submitted, waiting on webhook
--   ready     — video URL present, ready to post
--   failed    — Shotstack reported a render failure
--
-- Rendering is decoupled so users can cheaply generate 8 candidate
-- clips and only commit Shotstack credits to the ones they actually
-- want. Drafts can be deleted without touching Shotstack.
--
-- `transcript_words` on content_items carries Whisper's word-level
-- timestamps so the renderer can paint karaoke captions that flip at
-- word boundaries instead of guessing mid-phrase.
-- ===========================================================================

create type public.highlight_status as enum (
  'draft',
  'rendering',
  'ready',
  'failed'
);

-- ---------------------------------------------------------------------------
-- 1. Word-level transcript storage on content_items
-- ---------------------------------------------------------------------------
-- Shape: array of { word, start, end } — start/end in seconds.
-- Populated by the Whisper verbose_json path when captions are run.
-- Null means we only have the plain `transcript` and need to re-run
-- Whisper with word granularity before a highlight render can caption.
alter table public.content_items
  add column if not exists transcript_words jsonb;

-- ---------------------------------------------------------------------------
-- 2. content_highlights
-- ---------------------------------------------------------------------------
create table public.content_highlights (
  id                uuid primary key default gen_random_uuid(),
  content_id        uuid not null references public.content_items(id) on delete cascade,
  -- Denormalized for RLS parity with outputs — lets policies check
  -- workspace membership without joining to content_items.
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,

  -- Clip bounds in source-video seconds. Always non-null; AI returns
  -- them and users can nudge via the UI.
  start_seconds     numeric(10,2) not null,
  end_seconds       numeric(10,2) not null,

  -- What the AI thinks the hook/angle is. Rendered as a burn-in
  -- overlay in the first ~2.5s of the output clip.
  hook_text         text,
  -- Human explanation of why this moment was picked — shown in the UI
  -- card under the clip. Helps users decide which to render.
  reason            text,
  -- 0-100 heuristic score from GPT. Drives the card sort order.
  virality_score    smallint check (virality_score between 0 and 100),

  -- Render pipeline fields — filled in as the clip progresses.
  status            public.highlight_status not null default 'draft',
  render_id         text,
  video_url         text,
  render_error      text,

  -- User-chosen presentation. Defaults match "viral TikTok" look.
  caption_style     text not null default 'tiktok-bold',
  aspect_ratio      text not null default '9:16',

  -- Metadata bucket for future knobs (regenerate_count, face_tracking,
  -- hook_overrides, etc.) without schema churn.
  metadata          jsonb not null default '{}'::jsonb,

  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint content_highlights_valid_bounds
    check (end_seconds > start_seconds and end_seconds - start_seconds <= 180)
);

-- Listing + detail lookups both key on content_id first.
create index content_highlights_content_id_idx
  on public.content_highlights (content_id, created_at desc);

create index content_highlights_workspace_id_idx
  on public.content_highlights (workspace_id);

-- The Shotstack webhook handler looks up highlights by render_id to
-- transition them to ready/failed. Small partial index keeps that
-- hot-path cheap.
create index content_highlights_render_id_idx
  on public.content_highlights (render_id)
  where render_id is not null;

create trigger content_highlights_set_updated_at
  before update on public.content_highlights
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. RLS — same member-read, editor+-write pattern as outputs
-- ---------------------------------------------------------------------------
alter table public.content_highlights enable row level security;

create policy "content_highlights: select if member"
  on public.content_highlights for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "content_highlights: insert if editor+"
  on public.content_highlights for insert
  to authenticated
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "content_highlights: update if editor+"
  on public.content_highlights for update
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id))
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "content_highlights: delete if editor+"
  on public.content_highlights for delete
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id));
