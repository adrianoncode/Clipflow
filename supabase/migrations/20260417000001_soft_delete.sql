-- ===========================================================================
-- Soft delete for content_items and outputs
-- ===========================================================================
-- Accidentally deleted content used to be gone forever — hard DELETE with
-- ON DELETE CASCADE obliterated every output, state transition, render,
-- and scheduled post. This migration replaces user-facing deletes with a
-- soft-delete pattern: we set `deleted_at = now()` instead of DELETE, and
-- a nightly reaper cron hard-deletes rows with `deleted_at < now() - 30d`.
--
-- 30 days is enough for a user to realize they made a mistake, email
-- support, and get the row restored. After that it's permanently gone.
--
-- Scoped to content_items + outputs only — these are the big-loss cases
-- (whole transcripts / generated drafts). Workspaces stay hard-delete
-- because a workspace delete is a deliberate, rarer action.
-- ===========================================================================

alter table public.content_items
  add column if not exists deleted_at timestamptz;

alter table public.outputs
  add column if not exists deleted_at timestamptz;

-- Indexes for the reaper cron (find rows deleted >30d ago) and for the
-- hot-path getters that filter out soft-deleted rows.
create index if not exists content_items_deleted_at_idx
  on public.content_items(deleted_at)
  where deleted_at is not null;

create index if not exists outputs_deleted_at_idx
  on public.outputs(deleted_at)
  where deleted_at is not null;

-- Partial index on non-deleted rows for the common "list my content"
-- query pattern. Matches `workspace_id` + `deleted_at IS NULL`.
create index if not exists content_items_active_idx
  on public.content_items(workspace_id, created_at desc)
  where deleted_at is null;

create index if not exists outputs_active_idx
  on public.outputs(workspace_id, created_at desc)
  where deleted_at is null;
