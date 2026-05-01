-- ============================================================================
--  Scheduled-posts data-integrity hardening
-- ============================================================================
--
--  Three bugs the Phase 3 review surfaced — all fixed at the schema layer
--  so application bugs can't reintroduce double-publishing:
--
--  S1: The cron iterates one row at a time and calls Upload-Post per
--      row. Multiple rows with the same (workspace_id, output_id) for
--      different platforms => Upload-Post hit N times with the same
--      idempotency-keyless payload => the same TikTok video posted N
--      times. Fix: deduplicate at the DB. There can be only ONE active
--      scheduled_posts row per (workspace_id, output_id, platform).
--
--  S2: Two users in the same workspace can both call quickSchedule for
--      the same output+platform concurrently — both inserts succeed,
--      cron publishes twice. Same DB-level unique fixes both.
--
--  S3: Reschedule race. User moves a row from 10:00 → 14:00 right as
--      the cron picks the 10:00 row. The cron's `eq('status','scheduled')`
--      lock-update flips status anyway — without checking the new
--      scheduled_for. Adds a `version` integer the reschedule action
--      bumps; the cron lock now also requires `eq('version', snapshot)`.
--      A reschedule between fetch and lock makes the lock miss → cron
--      skips the row instead of double-firing it.
-- ============================================================================

-- 1. Version column for optimistic concurrency control on reschedule ─────────
alter table public.scheduled_posts
  add column if not exists version integer not null default 0;

comment on column public.scheduled_posts.version is
  'Bumped by every reschedule. Cron snapshots it on read and requires the same value on the lock-update — a reschedule between fetch and lock makes the lock miss, so cron skips the row instead of firing it at the stale time.';

-- 2. Partial unique index on (workspace_id, output_id, platform) ─────────────
-- Active states only. Once a post has been published or terminally
-- failed, the row sticks around for analytics — and a future
-- re-schedule of the same output+platform must be permitted.
create unique index if not exists scheduled_posts_active_unique_idx
  on public.scheduled_posts (workspace_id, output_id, platform)
  where status in ('scheduled', 'publishing');

comment on index public.scheduled_posts_active_unique_idx is
  'Prevents two active rows for the same (workspace, output, platform) — race-safe even if app code regresses. Allows re-scheduling after published/failed because the predicate excludes those states.';
