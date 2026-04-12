-- M10: Client Review Links
-- Shareable tokens that allow external reviewers to view outputs + leave comments.

-- ── review_links ─────────────────────────────────────────────────────────────
create table if not exists public.review_links (
  id           uuid primary key default gen_random_uuid(),
  token        text unique not null default encode(gen_random_bytes(24), 'base64url'),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_id   uuid not null references public.content_items(id) on delete cascade,
  created_by   uuid not null references auth.users(id),
  label        text,
  expires_at   timestamptz,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index review_links_token_idx on public.review_links(token);
create index review_links_content_id_idx on public.review_links(content_id);

alter table public.review_links enable row level security;

-- workspace members (owner/editor) can manage their links
create policy "workspace members can manage review links"
  on public.review_links for all
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = review_links.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

-- ── review_comments ──────────────────────────────────────────────────────────
create table if not exists public.review_comments (
  id             uuid primary key default gen_random_uuid(),
  review_link_id uuid not null references public.review_links(id) on delete cascade,
  output_id      uuid references public.outputs(id) on delete set null,
  reviewer_name  text not null,
  reviewer_email text,
  body           text not null,
  created_at     timestamptz not null default now()
);

create index review_comments_link_idx on public.review_comments(review_link_id);

alter table public.review_comments enable row level security;

-- workspace members can read all comments for their links
create policy "workspace members can read review comments"
  on public.review_comments for select
  using (
    exists (
      select 1 from public.review_links rl
      join public.workspace_members wm on wm.workspace_id = rl.workspace_id
      where rl.id = review_link_id
        and wm.user_id = auth.uid()
    )
  );

-- anyone can insert a comment on an active (non-expired) review link
-- (public reviewers are anonymous — server action validates the token server-side)
create policy "anyone can post review comment"
  on public.review_comments for insert
  with check (
    exists (
      select 1 from public.review_links
      where id = review_link_id
        and is_active = true
        and (expires_at is null or expires_at > now())
    )
  );
