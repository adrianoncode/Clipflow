-- Feature 12: Algorithm Update Feed — global table for all users

create table if not exists algorithm_updates (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,
  title           text not null,
  summary         text,
  url             text,
  platforms       text[] not null default '{}',
  ai_recommendations text[] not null default '{}',
  published_at    timestamptz,
  fetched_at      timestamptz not null default now()
);

create index if not exists algorithm_updates_fetched_idx
  on algorithm_updates (fetched_at desc);

alter table algorithm_updates enable row level security;

-- All authenticated users can read algorithm updates (global, not workspace-scoped)
create policy "authenticated users can read algorithm updates"
  on algorithm_updates for select
  using (auth.uid() is not null);
