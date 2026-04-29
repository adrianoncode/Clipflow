-- ===========================================================================
-- scheduled_posts: exponential-backoff retry fields
-- ===========================================================================
-- Today a publish failure (e.g. TikTok rate-limit, transient network
-- blip during the cron window) flips the post straight to status=
-- 'failed'. The user has to manually retry. This is brittle for the
-- 80% of failures that resolve themselves in a few minutes.
--
-- Slice 13 adds a retry counter + a next_retry_at gate so the same
-- cron picks the post up again after a backoff. After MAX_RETRIES
-- consecutive failures, the post stays in 'failed' for real and the
-- user gets the explicit error.
--
-- Backoff schedule (minutes from the last attempt):
--   retry_count 1 → 2 min
--   retry_count 2 → 4 min
--   retry_count 3 → 8 min
--   retry_count ≥ 4 → terminal `failed`
-- ===========================================================================

alter table public.scheduled_posts
  add column if not exists retry_count smallint not null default 0,
  add column if not exists next_retry_at timestamptz;

alter table public.scheduled_posts
  add constraint scheduled_posts_retry_count_chk
    check (retry_count >= 0 and retry_count <= 10);

create index if not exists scheduled_posts_retry_due_idx
  on public.scheduled_posts (next_retry_at)
  where status = 'scheduled' and next_retry_at is not null;

comment on column public.scheduled_posts.retry_count is
  'Number of failed publish attempts that triggered a backoff retry. Reset implicitly on terminal `failed` (no retries left) or `published`.';

comment on column public.scheduled_posts.next_retry_at is
  'When the cron is allowed to try again. Null = no backoff active. Cron filters `next_retry_at IS NULL OR next_retry_at <= now()`.';
