import { describe, expect, it } from '@jest/globals';

import { addDays } from '@/features/drill/local-date';
import { drillActions, initialDrillData, type DrillActions, type DrillData } from '@/features/drill/store';

import { challengeWeekday, dodgePattern, practiceToday, restartSequence, spineTally, wrapupDue } from '../plan';

// Day 45 answered on 2026-12-14 (a Monday) if day 1 is 2026-10-31.
const START = '2026-10-31';

function make() {
  let state: DrillData = structuredClone(initialDrillData);
  let n = 0;
  const a = drillActions(
    (f) => {
      state = { ...state, ...f(state) };
    },
    () => state,
    { now: () => new Date(Date.UTC(2026, 0, 1, 0, 0, n)), newId: () => `id-${++n}` },
  );
  return { a, get: () => state };
}

/** Plays the 45 days; `dodge` lists spine days answered Dodged it. */
function finishSpine(a: DrillActions, dodge: number[] = []): string {
  a.start(START, '07:00');
  let date = START;
  for (let day = 1; day <= 45; day++) {
    a.answer(a.openToday(date)!, dodge.includes(day) ? 'dodged' : 'done', 'five_minute');
    if (day < 45) date = addDays(date, 1);
  }
  return date; // date of day 45
}

describe('wrap-up', () => {
  it('is due the morning after Day 45, not on Day 45 itself', () => {
    const { a, get } = make();
    const d45 = finishSpine(a);
    expect(wrapupDue(get(), d45)).toBe(false);
    expect(wrapupDue(get(), addDays(d45, 1))).toBe(true);
  });

  it('tallies the spine and finds the top 3 dodged rules (ties by book order)', () => {
    const { a, get } = make();
    // rule 2: days 4,5 dodged; rule 5: days 13,14,15; rule 9: day 25; rule 1: day 1
    finishSpine(a, [1, 4, 5, 13, 14, 15, 25]);
    expect(spineTally(get())).toEqual({ done: 38, dodged: 7 });
    expect(dodgePattern(get())).toEqual([
      { ruleId: 5, dodged: 3, answered: 3 },
      { ruleId: 2, dodged: 2, answered: 3 },
      { ruleId: 1, dodged: 1, answered: 3 },
    ]);
  });

  it('no dodges, no pattern', () => {
    const { a, get } = make();
    finishSpine(a);
    expect(dodgePattern(get())).toEqual([]);
  });

  it('restart sequence is three tiers per rule in order', () => {
    expect(restartSequence([5, 2])).toEqual([
      { ruleId: 5, tier: 'five_minute' },
      { ruleId: 5, tier: 'uncomfortable' },
      { ruleId: 5, tier: 'daily' },
      { ruleId: 2, tier: 'five_minute' },
      { ruleId: 2, tier: 'uncomfortable' },
      { ruleId: 2, tier: 'daily' },
    ]);
  });
});

describe('practice days', () => {
  function setUp(dailySet: number[], restartRules: number[]) {
    const { a, get } = make();
    const d45 = finishSpine(a, [13, 14]);
    const d1 = addDays(d45, 1);
    a.setPractice({ dailySet: dailySet as 1[], restartRules: restartRules as 1[], startedOn: d1 });
    return { a, get, d45, d1 };
  }

  it('restart runs one drill a day, waiting for an answer; its rule sits out of the daily set', () => {
    const { a, get, d1 } = setUp([5, 7], [5]);
    let plan = practiceToday(get(), d1)!;
    expect(plan.day).toBe(46);
    expect(plan.restart).toEqual({ index: 1, total: 1 });
    expect(plan.slots.map((s) => `${s.kind}:${s.ruleId}:${s.tier}`)).toEqual(['restart:5:five_minute', 'daily:7:daily']);

    const ids = a.ensurePracticeToday(d1);
    expect(ids).toHaveLength(2);
    expect(a.ensurePracticeToday(d1)).toEqual(ids); // idempotent
    expect(get().drills[ids[0]]).toMatchObject({ kind: 'restart', day: 46, ruleId: 5, tier: 'five_minute', dirty: true });

    // Unanswered restart carries over to the next day with the next day number.
    const d2 = addDays(d1, 1);
    plan = practiceToday(get(), d2)!;
    expect(plan.day).toBe(47);
    expect(plan.slots[0]).toMatchObject({ kind: 'restart', tier: 'five_minute', row: { id: ids[0] } });
    a.ensurePracticeToday(d2);
    expect(get().drills[ids[0]]).toMatchObject({ scheduledFor: d2, day: 47 });

    // Answer it: tomorrow moves to uncomfortable.
    a.answer(ids[0], 'done', 'five_minute');
    expect(practiceToday(get(), d2)!.slots[0]).toMatchObject({ kind: 'restart', row: { id: ids[0], status: 'done' } });
    const d3 = addDays(d2, 1);
    expect(practiceToday(get(), d3)!.slots[0]).toMatchObject({ kind: 'restart', tier: 'uncomfortable' });
  });

  it('after the restart, its rule rejoins the daily set and "restart done" shows once', () => {
    const { a, get, d1 } = setUp([5], [5]);
    let date = d1;
    for (let i = 0; i < 3; i++) {
      const [id] = a.ensurePracticeToday(date);
      a.answer(id, 'done', get().drills[id].tier);
      date = addDays(date, 1);
    }
    let plan = practiceToday(get(), date)!;
    expect(plan.restart).toBeUndefined();
    expect(plan.restartDone).toBe(true);
    expect(plan.slots.map((s) => `${s.kind}:${s.ruleId}`)).toEqual(['daily:5']);
    a.ensurePracticeToday(date);
    plan = practiceToday(get(), addDays(date, 1))!;
    expect(plan.restartDone).toBe(false);
  });

  it('weekly challenge: uncomfortable drill on the weekday Day 45 was answered', () => {
    const { get, d45, d1 } = setUp([3, 8], []);
    expect(challengeWeekday(get())).toBe(new Date(2026, 11, 14).getDay());
    expect(practiceToday(get(), d1)!.slots.every((s) => s.tier === 'daily')).toBe(true);
    const plan = practiceToday(get(), addDays(d45, 7))!;
    expect(plan.slots.map((s) => [s.tier, s.weekly])).toEqual([
      ['uncomfortable', true],
      ['uncomfortable', true],
    ]);
  });

  it('day numbers count practice dates, not calendar gaps', () => {
    const { a, get, d1 } = setUp([1], []);
    a.ensurePracticeToday(d1); // 46
    expect(practiceToday(get(), addDays(d1, 10))!.day).toBe(47);
  });

  it('nothing before the wrap-up is locked in', () => {
    const { a, get } = make();
    const d45 = finishSpine(a);
    expect(practiceToday(get(), addDays(d45, 1))).toBeUndefined();
  });
});
