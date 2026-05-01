-- ============================================================================
--  Workspace timezone — first-class column
-- ============================================================================
--
--  WHY
--  ───
--  Schedule + Calendar + Plan views all use `toLocaleTimeString()` with the
--  browser's TZ. A user in Berlin viewing a US client's workspace sees
--  posts at "10am" — but those publish at 10am ET, four hours earlier.
--  Multi-team workspaces have no source of truth for "what time will this
--  post actually go live". The UI shows browser-time without saying so.
--
--  WHAT
--  ────
--  Add `workspaces.timezone` (IANA string, defaults to UTC). The Plan
--  best-time logic already accepts a timezone — we now pull it from this
--  column instead of hardcoding 'UTC' at scheduler-actions.ts:399, 572.
--  The UI surfaces the active TZ as a small mono kicker next to every
--  time on Schedule + Calendar + Plan views.
-- ============================================================================

alter table public.workspaces
  add column if not exists timezone text not null default 'UTC';

comment on column public.workspaces.timezone is
  'IANA timezone string (e.g. "Europe/Berlin", "America/Los_Angeles"). All scheduled-post times are interpreted in this TZ. Defaults to UTC; users can change in Settings > Workspace.';

-- The branding JSONB already had a `timezone` key in some rows. Backfill
-- the column from there so existing workspaces don't snap to UTC.
update public.workspaces
set timezone = nullif(branding ->> 'timezone', '')
where (branding ->> 'timezone') is not null
  and (branding ->> 'timezone') <> '';
