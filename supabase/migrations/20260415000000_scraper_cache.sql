-- ===========================================================================
-- Scraper cache — TTL-based result cache for Apify + other scraper calls
-- ===========================================================================
-- Every scraper result is cached here keyed on a stable hash of the
-- actor-id + input params. When the same query lands within the TTL
-- window we return the cached rows and save the Apify cost.
--
-- Not workspace-scoped: trending-sound data is identical for every
-- user looking at the same niche, caching globally lets us coalesce
-- duplicate requests across the whole userbase.
-- ===========================================================================

create table public.scraper_cache (
  /**
   * Stable SHA-256 hash of the actor + sorted-input-json. Callers
   * compute this themselves so they can branch on hit/miss before
   * touching the DB.
   */
  cache_key     text primary key,
  /**
   * Original actor name for debugging / analytics, e.g.
   * 'scraptik/tiktok-api'.
   */
  actor         text not null,
  /**
   * Arbitrary JSON payload returned from the scraper — callers are
   * responsible for the shape, we just persist it opaquely.
   */
  data          jsonb not null,
  /**
   * Hard expiry — rows past this are treated as cache-miss and will
   * be overwritten. A nightly job can purge them but it's not required:
   * they cost pennies in storage.
   */
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index scraper_cache_expires_idx on public.scraper_cache(expires_at);
create index scraper_cache_actor_idx   on public.scraper_cache(actor);

create trigger scraper_cache_set_updated_at
  before update on public.scraper_cache
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — server-side only. We read/write via the service-role client
-- from lib/scrapers/cache.ts; clients never see this table.
-- ---------------------------------------------------------------------------
alter table public.scraper_cache enable row level security;

-- No policies added intentionally → regular users can't select/insert/update.
-- Service role bypasses RLS so the cache library works.
