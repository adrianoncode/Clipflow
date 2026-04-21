-- ===========================================================================
-- Render priority — surface the "priority render queue" Studio benefit.
-- ===========================================================================
-- Adds a `priority` column to `renders` so the Studio plan can get real
-- differentiation beyond a landing-page bullet. `high` renders are
-- polled more aggressively by the client and are the ones we would
-- move to the front of an internal dispatch queue if Shotstack ever
-- starts to rate-limit us.
--
-- Values:
--   'normal' — default for Free / Creator.
--   'high'   — set when the owning workspace is on the Studio (agency)
--              plan at the moment of submission. Recorded per-render,
--              so downgrading later doesn't retroactively demote an
--              in-flight job.
-- ===========================================================================

create type public.render_priority as enum ('normal', 'high');

alter table public.renders
  add column priority public.render_priority not null default 'normal';

-- Most poller queries filter by workspace + status; a partial index on
-- high-priority in-flight jobs keeps the "is anything expedited right
-- now?" question cheap without carrying weight for the common case.
create index if not exists renders_high_priority_pending_idx
  on public.renders (created_at desc)
  where priority = 'high' and status = 'rendering';
