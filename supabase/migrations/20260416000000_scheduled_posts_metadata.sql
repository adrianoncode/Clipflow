-- Add metadata JSONB column to scheduled_posts for storing engagement stats
-- from Upload-Post (views, likes, comments, shares, engagement_rate, etc.)
alter table scheduled_posts
  add column if not exists metadata jsonb default '{}'::jsonb;

-- Track when stats were last fetched so the cron job skips recently-checked posts
alter table scheduled_posts
  add column if not exists stats_fetched_at timestamptz;

-- Index for the stats cron: find published posts that haven't been checked recently
create index if not exists scheduled_posts_stats_cron_idx
  on scheduled_posts(published_at)
  where status = 'published' and published_at is not null;
