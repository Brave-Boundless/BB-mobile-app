-- Journal free notes (redesign, Mark 2026-11-09): an entry can stand alone,
-- written from the Journal tab's Write button, with no drill behind it.
-- Drill report-backs keep their drill_day_id exactly as before.

alter table public.journal_entries alter column drill_day_id drop not null;

comment on column public.journal_entries.drill_day_id is
  'The drill this report-back answers; null for a free note written from the Journal.';

-- A drill day, when given, must still belong to the same user.
drop policy "journal_entries: insert own" on public.journal_entries;
create policy "journal_entries: insert own"
  on public.journal_entries for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      drill_day_id is null
      or exists (
        select 1 from public.drill_days d
        where d.id = drill_day_id and d.user_id = (select auth.uid())
      )
    )
  );

drop policy "journal_entries: update own" on public.journal_entries;
create policy "journal_entries: update own"
  on public.journal_entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      drill_day_id is null
      or exists (
        select 1 from public.drill_days d
        where d.id = drill_day_id and d.user_id = (select auth.uid())
      )
    )
  );
