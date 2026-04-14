-- Add a free-form `source` tag to referrals so we can attribute paid
-- conversions to the channel that produced them (twitter, linkedin, dm,
-- email, etc.). Captured via `?ref=CODE&source=twitter` on landing URLs.
--
-- Also adds a `blocked` status for referrals that look like self-referral
-- via disposable inbox (see lib/referrals/is-disposable-email.ts).
alter type public.referral_status add value if not exists 'blocked';

alter table public.referrals
  add column if not exists source text;

create index if not exists referrals_source_idx on public.referrals(source);
