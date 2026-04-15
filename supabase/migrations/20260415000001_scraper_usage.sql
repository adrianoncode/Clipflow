-- ===========================================================================
-- Scraper usage — per-workspace per-feature call log for quota enforcement
-- ===========================================================================
-- One row per scraper-backed feature invocation (hashtag query,
-- competitor analysis, viral discovery, etc). We count rows for the
-- current calendar month to enforce plan quotas from
-- lib/billing/check-feature.ts.
--
-- Separate from `scraper_cache` on purpose: cache is global (same
-- trending-sounds list serves every user), usage is per-workspace for
-- billing-grade counting. A cache-hit still logs usage — we charge
-- the user for the query, not the upstream Apify call.
-- ===========================================================================

create type public.scraper_feature as enum (
  'trending_sounds',
  'hashtag_query',
  'competitor_analysis',
  'viral_discovery',
  'comment_mining'
);

create table public.scraper_usage (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  feature       public.scraper_feature not null,
  /** Freeform label for debugging — e.g. 'tiktok@username', '#cybersecurity'. */
  target        text,
  /** Whether this specific call was served from cache (no Apify cost). */
  cache_hit     boolean not null default false,
  /** Optional: the row in `scraper_cache` this query resolved to. */
  cache_key     text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index scraper_usage_workspace_idx
  on public.scraper_usage(workspace_id, created_at desc);
create index scraper_usage_feature_idx
  on public.scraper_usage(feature);

-- ---------------------------------------------------------------------------
-- RLS — members can read their own workspace usage (useful for the
-- usage dashboard). Only service role writes.
-- ---------------------------------------------------------------------------
alter table public.scraper_usage enable row level security;

create policy "scraper_usage: select if member"
  on public.scraper_usage for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

-- No insert/update/delete policies — writes happen server-side only
-- via the service-role client from lib/scrapers/log-usage.ts.
