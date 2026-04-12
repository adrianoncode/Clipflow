-- M8: Subscriptions + billing
create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
);

create type public.billing_plan as enum (
  'free',
  'solo',
  'team',
  'agency'
);

create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  workspace_id            uuid not null references public.workspaces(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  plan                    public.billing_plan not null default 'free',
  status                  public.subscription_status,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create unique index subscriptions_workspace_id_idx on public.subscriptions(workspace_id);

alter table public.subscriptions enable row level security;

-- Owners can read their own workspace subscription
create policy "owners can read subscription"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = subscriptions.workspace_id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

-- Only service role writes (via webhook + server actions)
