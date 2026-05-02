-- ============================================================================
--  Trend-Matching — daily snapshot of YouTube-trending keywords per niche
-- ============================================================================
--
--  Phase 2 of the Deep-Research feature pass. A scheduled job pulls
--  the most-viewed videos from the last 7d for each niche, extracts
--  high-frequency words from titles + tags, and persists the top 30
--  keywords per niche. The viral-moment detector then post-processes
--  each candidate clip and awards a `trend_bonus` for every match
--  found in `hook_text` or the first three sentences.
--
--  Design choices:
--
--  - `trending_keywords` is workspace-agnostic. Keywords are scoped
--    by `niche_id` (the same string set as lib/niche/presets.ts) so
--    every workspace with the same `active_niche` shares one cache.
--  - Public-readable RLS — keywords are not user data and the join
--    happens server-side anyway.
--  - Service-role-only writes via the cron endpoint. No user-facing
--    insert path — wouldn't make sense.
--  - Two new columns on content_highlights (`trending_keywords` +
--    `trend_bonus`) so the UI can render `87 (+10 trending)` badges
--    without re-querying the trending table on render.
-- ============================================================================

create table if not exists public.trending_keywords (
  id uuid primary key default gen_random_uuid(),
  niche_id text not null,
  keyword text not null,
  frequency smallint not null check (frequency >= 0),
  score smallint not null check (score between 0 and 100),
  source text not null default 'youtube',
  fetched_at timestamptz not null default now(),
  unique (niche_id, keyword, fetched_at)
);

comment on table public.trending_keywords is
  'Daily snapshot of trending keywords per niche, used to award a virality-score bonus to highlight candidates that mention them. Service-role-only writes via /api/cron/trends.';

create index if not exists trending_keywords_niche_fresh_idx
  on public.trending_keywords (niche_id, fetched_at desc);

alter table public.trending_keywords enable row level security;

-- Anyone authenticated can read (keywords aren't sensitive). Anon
-- (logged-out marketing pages) doesn't need access — no policy.
drop policy if exists "auth read trending keywords"
  on public.trending_keywords;
create policy "auth read trending keywords"
  on public.trending_keywords
  for select
  using (auth.role() = 'authenticated');

-- Add columns to content_highlights for surfacing the bonus.
alter table public.content_highlights
  add column if not exists trending_keywords text[] not null default '{}',
  add column if not exists trend_bonus smallint not null default 0
    check (trend_bonus between 0 and 30);

comment on column public.content_highlights.trending_keywords is
  'Subset of trending keywords (per the workspace niche) that appeared in this clip''s hook or first sentences. Surfaced in UI as "matched: ...".';

comment on column public.content_highlights.trend_bonus is
  'Add-on score (0..30) layered onto virality_score when trending keywords matched. Computed at find-time and stored, not recomputed on read.';
