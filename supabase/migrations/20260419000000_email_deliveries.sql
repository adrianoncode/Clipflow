-- Email deliveries log
--
-- Tracks every transactional email we send. Exists for two reasons:
--
--   1. Dedupe — the re-engagement cron runs daily. Without a "have
--      we already sent this kind to this user?" check, a delayed run
--      could double-send and annoy people.
--
--   2. Audit / support — when a user writes in saying "I never got
--      the email", we can grep this table and tell them whether
--      Resend accepted it or if the send was skipped.
--
-- Kept lean: we don't store body or subject, only the kind + user.
-- Content is reconstructible from the sender function at any time.

create table if not exists public.email_deliveries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- Well-known kind strings. Kept as text (not enum) so adding a new
  -- email type doesn't require a migration — just a new sender function.
  kind         text not null,
  sent_at      timestamptz not null default now(),
  metadata     jsonb
);

-- Lookup by (user_id, kind) is the hot path — "have we sent this kind
-- to this user yet?"
create index if not exists email_deliveries_user_kind_idx
  on public.email_deliveries (user_id, kind);

create index if not exists email_deliveries_sent_at_idx
  on public.email_deliveries (sent_at desc);

alter table public.email_deliveries enable row level security;

-- Users can read their own send history (helpful for Support / the
-- audit endpoint eventually). Writes go through the service role —
-- senders are all server-side.
create policy "email_deliveries select own"
  on public.email_deliveries
  for select
  using (user_id = auth.uid());
