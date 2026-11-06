-- Build step 6: what happens after Day 45.
--
-- drill_days.kind tells the three tracks apart:
--   spine   = the 45-day sequence (days 1-45)
--   restart = re-running the 3 days of a rule from the dodge pattern
--   daily   = the recurring daily set (with a weekly uncomfortable challenge)
-- Existing rows are all spine; the constant default backfills them without a
-- table rewrite.
alter table public.drill_days
  add column kind text not null default 'spine'
  check (kind in ('spine', 'restart', 'daily'));

alter table public.drill_days
  add constraint drill_days_spine_days check (kind <> 'spine' or day_number <= 45),
  add constraint drill_days_practice_days check (kind = 'spine' or day_number > 45);

-- The user's choices at the wrap-up, kept on their row so a new phone gets them.
-- RLS: the existing "users: update own row" policy covers these columns.
alter table public.users
  add column daily_set smallint[] not null default '{}'
    check (daily_set <@ array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]::smallint[]),
  add column restart_rules smallint[] not null default '{}'
    check (restart_rules <@ array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]::smallint[]
           and cardinality(restart_rules) <= 3),
  add column practice_started_on date;
