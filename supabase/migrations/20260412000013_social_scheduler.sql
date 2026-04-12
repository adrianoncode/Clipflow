-- Social accounts connected by users (OAuth tokens)
create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null, -- 'tiktok' | 'instagram' | 'linkedin' | 'youtube'
  platform_user_id text not null,
  platform_username text,
  access_token text not null, -- encrypted in production, plaintext for MVP
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(workspace_id, platform, platform_user_id)
);

alter table social_accounts enable row level security;

create policy "workspace members can view social accounts"
  on social_accounts for select
  using (exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = social_accounts.workspace_id
    and workspace_members.user_id = auth.uid()
  ));

create policy "owners can manage social accounts"
  on social_accounts for all
  using (exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = social_accounts.workspace_id
    and workspace_members.user_id = auth.uid()
    and workspace_members.role in ('owner', 'editor')
  ));

-- Scheduled posts queue
create table if not exists scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  output_id uuid not null references outputs(id) on delete cascade,
  social_account_id uuid references social_accounts(id) on delete set null,
  platform text not null,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled', -- 'scheduled' | 'publishing' | 'published' | 'failed'
  published_at timestamptz,
  platform_post_id text, -- ID returned by platform after publishing
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table scheduled_posts enable row level security;

create policy "workspace members can view scheduled posts"
  on scheduled_posts for select
  using (exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = scheduled_posts.workspace_id
    and workspace_members.user_id = auth.uid()
  ));

create policy "owners and editors can manage scheduled posts"
  on scheduled_posts for all
  using (exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = scheduled_posts.workspace_id
    and workspace_members.user_id = auth.uid()
    and workspace_members.role in ('owner', 'editor')
  ));

create index if not exists scheduled_posts_scheduled_for_idx
  on scheduled_posts(scheduled_for)
  where status = 'scheduled';
