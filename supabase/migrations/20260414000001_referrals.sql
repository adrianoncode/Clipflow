-- ===========================================================================
-- Referrals — give 20 %, get 20 %
-- ===========================================================================
-- When a paying customer refers a new user and that user starts a paid
-- subscription, both sides get 20 % off (via a single Stripe coupon
-- applied to each subscription as a `forever` discount).
--
-- - profiles.referral_code  : unique share code per user, generated on insert
-- - referrals               : one row per (referrer, referee) pair
--                             status: pending  → referee signed up but
--                                                 hasn't converted yet
--                                     confirmed → referee started a paid sub,
--                                                 coupons applied on both sides
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum
-- ---------------------------------------------------------------------------
create type public.referral_status as enum ('pending', 'confirmed');


-- ---------------------------------------------------------------------------
-- 2. profiles.referral_code
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column referral_code text unique;

-- Base32-ish 8-char code. Ambiguous chars (0/O, 1/I/L) removed.
create or replace function public.generate_referral_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code     text;
  i        int;
  attempts int := 0;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    -- Retry on collision (very unlikely with 30^8 ≈ 6.5e11)
    if not exists (select 1 from public.profiles where referral_code = code) then
      return code;
    end if;
    attempts := attempts + 1;
    if attempts > 10 then
      raise exception 'Could not generate unique referral code after 10 attempts';
    end if;
  end loop;
end;
$$;

-- Backfill existing profiles
update public.profiles
set referral_code = public.generate_referral_code()
where referral_code is null;

-- Make it NOT NULL after backfill
alter table public.profiles
  alter column referral_code set not null;

-- Trigger: generate a code for every new profile
create or replace function public.set_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null then
    new.referral_code := public.generate_referral_code();
  end if;
  return new;
end;
$$;

create trigger profiles_set_referral_code
  before insert on public.profiles
  for each row execute function public.set_referral_code();


-- ---------------------------------------------------------------------------
-- 3. referrals table
-- ---------------------------------------------------------------------------
create table public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_user_id  uuid not null references public.profiles(id) on delete cascade,
  referee_user_id   uuid not null references public.profiles(id) on delete cascade,
  status            public.referral_status not null default 'pending',
  confirmed_at      timestamptz,
  created_at        timestamptz not null default now(),
  -- A user can only be referred once, ever.
  constraint referrals_referee_unique unique (referee_user_id),
  -- Can't refer yourself.
  constraint referrals_no_self_refer check (referrer_user_id <> referee_user_id)
);

create index referrals_referrer_idx on public.referrals(referrer_user_id);
create index referrals_status_idx   on public.referrals(status);


-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
alter table public.referrals enable row level security;

-- Users can see referrals they are part of (either side).
create policy "referrals: select self"
  on public.referrals for select
  to authenticated
  using (referrer_user_id = auth.uid() or referee_user_id = auth.uid());

-- Writes only via service role (signup action + webhook).
