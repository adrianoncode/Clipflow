-- ===========================================================================
-- Renders — persisted cloud-rendered video jobs
-- ===========================================================================
-- Each row is one Shotstack (or Replicate) render job. We capture the
-- submit response immediately (status='rendering'), then the
-- /api/video/render-status route flips the row to done/failed with the
-- final MP4 URL when polling resolves.
--
-- Before this migration, every render URL was only returned to the
-- client transiently — users had to copy the link before it expired.
-- Now every render is durable, queryable per content item, and shows
-- up as a proper output of the AI pipeline.
-- ===========================================================================

create type public.render_kind as enum (
  'burn_captions',
  'assemble_broll',
  'branded_video',
  'clip',
  'batch_clip',
  'reframe',
  'subtitles',
  'avatar',
  'dub',
  'faceless'
);

create type public.render_status as enum (
  'rendering',
  'done',
  'failed'
);

create type public.render_provider as enum ('shotstack', 'replicate');

create table public.renders (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  content_id    uuid references public.content_items(id) on delete cascade,
  kind          public.render_kind not null,
  provider      public.render_provider not null default 'shotstack',
  /**
   * The provider's render id — used by /api/video/render-status to poll.
   * Nullable because some providers might respond asynchronously or we
   * might record a synchronous failure before we even got one.
   */
  provider_render_id text,
  status        public.render_status not null default 'rendering',
  url           text,
  error         text,
  metadata      jsonb not null default '{}'::jsonb,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index renders_workspace_id_idx      on public.renders(workspace_id);
create index renders_content_id_idx        on public.renders(content_id);
create index renders_provider_id_idx       on public.renders(provider_render_id);
create index renders_workspace_created_idx
  on public.renders(workspace_id, created_at desc);

create trigger renders_set_updated_at
  before update on public.renders
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- RLS — same pattern as outputs: members read, editors+ write.
-- ---------------------------------------------------------------------------
alter table public.renders enable row level security;

create policy "renders: select if member"
  on public.renders for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "renders: insert if editor+"
  on public.renders for insert
  to authenticated
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "renders: update if editor+"
  on public.renders for update
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id))
  with check (public.is_workspace_editor_or_above(workspace_id));

create policy "renders: delete if editor+"
  on public.renders for delete
  to authenticated
  using (public.is_workspace_editor_or_above(workspace_id));
