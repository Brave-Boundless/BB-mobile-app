-- Brave & Boundless — initial schema.
--
-- Row-level security is enabled on every table in this migration. No table is
-- ever created without RLS.
--
-- Client-generated UUIDs: drill_days and journal_entries accept ids from the
-- client so rows can be created offline and synced later without remapping.
-- updated_at on every user-owned row lets the sync layer resolve conflicts
-- (last write wins in phase 1).

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.drill_tier as enum ('five_minute', 'uncomfortable', 'daily');
create type public.drill_status as enum ('pending', 'done', 'dodged');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users: one row per auth user. Holds app settings, not credentials.
-- ---------------------------------------------------------------------------

create table public.users (
  id           uuid primary key references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  display_name text check (char_length(display_name) <= 80),
  tz           text not null default 'UTC',          -- IANA zone, e.g. 'America/Chicago'
  notify_at    time not null default '07:00'          -- local time of the morning push
);

alter table public.users enable row level security;

create policy "users: read own row"
  on public.users for select to authenticated
  using ((select auth.uid()) = id);

create policy "users: update own row"
  on public.users for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Inserts happen only through the signup trigger below; deletes cascade from
-- auth.users when the account is deleted.

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- rules: the 15 Boundless Rule Cards. Read-only reference data.
-- Seeded from content/bb-rule-cards.json by scripts/generate-rules-migration.ts.
-- Never edit rows by hand; edit the JSON and regenerate.
-- ---------------------------------------------------------------------------

create table public.rules (
  id                  smallint primary key check (id between 1 and 15),
  part                smallint not null check (part between 1 and 4),
  title               text not null,
  chapter             text not null,
  why                 text not null,
  drill_5min          text not null,
  drill_uncomfortable text not null,
  drill_daily         text not null,
  scorecard           text not null,
  mantra              text not null
);

alter table public.rules enable row level security;

create policy "rules: readable by everyone"
  on public.rules for select to anon, authenticated
  using (true);

-- No insert/update/delete policies: only migrations (service role) write here.

-- ---------------------------------------------------------------------------
-- drill_days: one row per scheduled drill.
-- Days 1-45 are the spine (one rule per day). After day 45 a user may run
-- several rules as recurring dailies, so (user, day, rule) is the unique key.
-- ---------------------------------------------------------------------------

create table public.drill_days (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  day_number    integer not null check (day_number >= 1),
  rule_id       smallint not null references public.rules (id),
  tier          public.drill_tier not null,
  scheduled_for date not null,
  status        public.drill_status not null default 'pending',
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, day_number, rule_id),
  -- A response time exists exactly when the drill has been answered.
  check ((status = 'pending') = (responded_at is null))
);

create index drill_days_user_scheduled_idx on public.drill_days (user_id, scheduled_for);
create index drill_days_user_rule_idx on public.drill_days (user_id, rule_id);

alter table public.drill_days enable row level security;

create policy "drill_days: read own"
  on public.drill_days for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "drill_days: insert own"
  on public.drill_days for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "drill_days: update own"
  on public.drill_days for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "drill_days: delete own"
  on public.drill_days for delete to authenticated
  using ((select auth.uid()) = user_id);

create trigger drill_days_set_updated_at
  before update on public.drill_days
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- journal_entries: evening report-backs, 1-3 sentences, tied to a drill day.
-- ---------------------------------------------------------------------------

create table public.journal_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  drill_day_id uuid not null references public.drill_days (id) on delete cascade,
  body         text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index journal_entries_user_created_idx on public.journal_entries (user_id, created_at desc);
create index journal_entries_drill_day_idx on public.journal_entries (drill_day_id);

alter table public.journal_entries enable row level security;

create policy "journal_entries: read own"
  on public.journal_entries for select to authenticated
  using ((select auth.uid()) = user_id);

-- The drill day must belong to the same user; otherwise a user could attach
-- entries to someone else's drill row by guessing its id.
create policy "journal_entries: insert own"
  on public.journal_entries for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.drill_days d
      where d.id = drill_day_id and d.user_id = (select auth.uid())
    )
  );

create policy "journal_entries: update own"
  on public.journal_entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.drill_days d
      where d.id = drill_day_id and d.user_id = (select auth.uid())
    )
  );

create policy "journal_entries: delete own"
  on public.journal_entries for delete to authenticated
  using ((select auth.uid()) = user_id);

create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- rule_stats: per-user, per-rule counts and current streak.
-- security_invoker makes the view run with the caller's RLS, so a user only
-- ever sees their own stats.
--
-- current_streak = number of consecutive 'done' drills for that rule, counting
-- back from the most recent answered drill. A 'dodged' breaks it. 'pending'
-- drills are ignored (not yet answered).
-- ---------------------------------------------------------------------------

create view public.rule_stats
with (security_invoker = true)
as
with answered as (
  select
    d.user_id,
    d.rule_id,
    d.status,
    row_number() over (
      partition by d.user_id, d.rule_id
      order by d.scheduled_for desc, d.day_number desc
    ) as recency
  from public.drill_days d
  where d.status <> 'pending'
),
first_break as (
  select user_id, rule_id, min(recency) as recency
  from answered
  where status = 'dodged'
  group by user_id, rule_id
)
select
  a.user_id,
  a.rule_id,
  count(*) filter (where a.status = 'done')   as done_count,
  count(*) filter (where a.status = 'dodged') as dodged_count,
  coalesce(min(fb.recency) - 1, count(*))     as current_streak
from answered a
left join first_break fb using (user_id, rule_id)
group by a.user_id, a.rule_id;

grant select on public.rule_stats to authenticated;
