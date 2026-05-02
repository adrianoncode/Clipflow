-- ============================================================================
--  ZapCap Animated Captions — BYOK render variants per highlight
-- ============================================================================
--
--  Phase 3 of the Deep-Research feature pass. Each highlight already
--  gets a Shotstack render with the existing baseline captions; this
--  migration adds the parallel "captioned-variant" pipeline that uses
--  ZapCap to burn animated, word-by-word, MrBeast/Hormozi-style
--  captions on top of the Shotstack output.
--
--  Two changes:
--
--  1. Extend `ai_keys.provider` to accept 'zapcap'. The encrypted
--     payload for that provider is JSON `{apiKey, webhookSecret}`
--     because ZapCap requires both at runtime (the webhook secret
--     ships separately from the API key in their dashboard).
--
--  2. New `caption_renders` table — one row per
--     (highlight × ZapCap-template). The render is async and
--     long-running, so we track lifecycle independently from the
--     Shotstack render that powers `content_highlights`.
-- ============================================================================

-- ── ai_keys: add zapcap as a valid provider ──────────────────────────────────
alter table public.ai_keys drop constraint if exists ai_keys_provider_check;

alter table public.ai_keys
  add constraint ai_keys_provider_check check (
    provider in (
      'openai',
      'anthropic',
      'google',
      'shotstack',
      'replicate',
      'elevenlabs',
      'upload-post',
      'zapcap'
    )
  );

-- ── caption_renders ──────────────────────────────────────────────────────────
create table if not exists public.caption_renders (
  id uuid primary key default gen_random_uuid(),
  highlight_id uuid not null references public.content_highlights(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  -- ZapCap template — opaque UUID returned by GET /templates from
  -- the user's account. Stored verbatim so we can re-render the
  -- same style later without a UI round-trip.
  template_id text not null,

  -- ZapCap object IDs — videoId from the upload, taskId from the
  -- render task. The webhook posts back with `taskId`; we look the
  -- row up by it.
  zapcap_video_id text not null,
  zapcap_task_id text not null,

  status text not null default 'queued'
    check (status in ('queued', 'processing', 'ready', 'failed')),

  /** ZapCap's CDN URL for the finished captioned MP4 — populated by
   *  the webhook on event=completed. We point the player straight at
   *  this URL for MVP; mirroring to Supabase Storage is a follow-up. */
  output_url text,

  /** Failure reason from ZapCap when status='failed'. */
  error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  /** A workspace can only have ONE render per (highlight, template) —
   *  re-rendering the same combo replaces the old row via the action
   *  layer, not a duplicate insert. */
  unique (highlight_id, template_id)
);

comment on table public.caption_renders is
  'Animated-caption render variants per highlight, produced via the user''s ZapCap account. One row per (highlight, ZapCap template). Lifecycle is queued → processing → ready|failed, driven by the ZapCap webhook.';

create index if not exists caption_renders_zapcap_task_idx
  on public.caption_renders (zapcap_task_id);

create index if not exists caption_renders_highlight_idx
  on public.caption_renders (highlight_id);

create index if not exists caption_renders_pending_idx
  on public.caption_renders (status, updated_at)
  where status in ('queued', 'processing');

-- updated_at auto-bump on row update (mirrors the pattern used on
-- content_highlights and other lifecycle tables in this repo).
create or replace function public.set_caption_renders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists caption_renders_updated_at on public.caption_renders;
create trigger caption_renders_updated_at
  before update on public.caption_renders
  for each row
  execute function public.set_caption_renders_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.caption_renders enable row level security;

drop policy if exists "members read caption renders"
  on public.caption_renders;
create policy "members read caption renders"
  on public.caption_renders
  for select
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

-- Editors and owners can create / update rows (the action layer
-- enforces this too via requireWorkspaceMember; keep both gates for
-- defense-in-depth).
drop policy if exists "editors write caption renders"
  on public.caption_renders;
create policy "editors write caption renders"
  on public.caption_renders
  for all
  using (
    public.is_workspace_editor_or_above(workspace_id)
  )
  with check (
    public.is_workspace_editor_or_above(workspace_id)
  );
