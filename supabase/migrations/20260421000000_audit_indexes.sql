-- Indexes identified by the perf audit. Each covers a real query that
-- today falls back to a sequential scan as the relevant table grows.

-- `fetch-stats` cron + analytics page filter:
--   where status = 'published' and published_at >= now() - interval
-- The existing workspace_scheduled index covers scheduled_for, not
-- published_at, so published-post queries fall off it.
create index if not exists scheduled_posts_workspace_status_published_idx
  on scheduled_posts (workspace_id, status, published_at desc);

-- `publish-scheduled` cron runs across all workspaces:
--   where status = 'scheduled' and scheduled_for <= now()
-- No workspace filter, so the workspace_scheduled index is partially
-- useful but the planner can still scan large segments of the table
-- when many workspaces have due posts. A status + time index gives the
-- planner a tight range scan.
create index if not exists scheduled_posts_status_scheduled_for_idx
  on scheduled_posts (status, scheduled_for)
  where status = 'scheduled';

-- Re-engagement cron groups by creator:
--   select created_by from content_items where created_by in (...)
-- In a 50k-row content_items table this still scans without an index.
create index if not exists content_items_created_by_idx
  on content_items (created_by);

-- hasOutputs + content-detail outputCount both filter by
-- (content_id, workspace_id) where deleted_at is null. A partial
-- composite index makes the lookup index-only.
create index if not exists outputs_content_workspace_live_idx
  on outputs (content_id, workspace_id)
  where deleted_at is null;
