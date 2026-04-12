create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  type text not null, -- 'transcription_done' | 'outputs_generated' | 'post_published' | 'post_failed' | 'invite_accepted'
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "users can read own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "users can update own notifications"
  on notifications for update
  using (user_id = auth.uid());

create index if not exists notifications_user_unread_idx
  on notifications(user_id, created_at desc)
  where read = false;
