-- ===========================================================================
-- RSS subscriptions — auto-import new podcast episodes
-- ===========================================================================
-- A workspace can subscribe to a podcast RSS feed. The daily cron
-- fetches each feed, compares the newest item's guid against
-- `last_seen_guid`, and creates one content_items row per genuinely
-- new episode. Old episodes are never re-imported.
--
-- One-shot imports (the existing "import RSS" flow) do NOT create a
-- subscription row — they just land an episode as content. Users
-- opt in to polling via a checkbox on the RSS import form.
-- ===========================================================================

create table public.rss_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  feed_url      text not null,
  /** Channel title at subscription time — kept for UI display so we
   *  don't re-parse the feed on every list page. Refreshed by the
   *  cron on successful polls. */
  channel_title text,
  /** Most recent episode guid we've already imported. Used to diff
   *  against the feed on each poll — anything newer than this gets
   *  imported as a new content item. */
  last_seen_guid text,
  /** ISO timestamp of the last successful poll. Separate from
   *  updated_at so we can tell "poll failed" from "poll succeeded
   *  with no new episodes". */
  last_polled_at timestamptz,
  /** Most recent error message, if the last poll failed. Cleared on
   *  next successful poll. */
  last_error     text,
  /** Owner of the subscription row — used in audit-log + removed
   *  when the user leaves the workspace. */
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- One subscription per (workspace, feed_url). Lets us safely re-run
  -- the "subscribe" action without duplicating rows.
  unique (workspace_id, feed_url)
);

create index rss_subscriptions_workspace_idx
  on public.rss_subscriptions (workspace_id);

-- The cron reads "every subscription, globally" on each run so the
-- table scan is the critical path. A plain index on created_at keeps
-- that scan cheap as the table grows.
create index rss_subscriptions_created_at_idx
  on public.rss_subscriptions (created_at desc);

create trigger rss_subscriptions_set_updated_at
  before update on public.rss_subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — standard member-read, editor+-write pattern
-- ---------------------------------------------------------------------------
alter table public.rss_subscriptions enable row level security;

create policy "rss_subscriptions: select if member"
  on public.rss_subscriptions for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "rss_subscriptions: insert if editor+"
  on public.rss_subscriptions for insert
  to authenticated
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "rss_subscriptions: update if editor+"
  on public.rss_subscriptions for update
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id))
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "rss_subscriptions: delete if editor+"
  on public.rss_subscriptions for delete
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id));
