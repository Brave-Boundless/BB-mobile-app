-- Build step 7: what the reader says about each answered drill.
--
-- effort       = "How hard was it?" 1 (Easy) to 5 (Brutal), only on done drills.
-- dodge_reason = "What got in the way?" on dodged drills.
-- Both optional (the reader can skip), both cleared by Undo.
-- RLS: the existing drill_days policies cover these columns.
alter table public.drill_days
  add column effort smallint
    check (effort between 1 and 5),
  add column dodge_reason text
    check (dodge_reason in ('fear', 'time', 'forgot', 'point', 'other'));

alter table public.drill_days
  add constraint drill_days_effort_when_done check (effort is null or status = 'done'),
  add constraint drill_days_reason_when_dodged check (dodge_reason is null or status = 'dodged');
