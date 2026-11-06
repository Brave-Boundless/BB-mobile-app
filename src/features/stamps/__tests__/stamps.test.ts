import { describe, expect, it } from '@jest/globals';

import { rules } from '@/content';
import { drillActions, initialDrillData, type DrillData } from '@/features/drill/store';

import { earnedStamps, stampArt, stampFor } from '../stamps';

function storeWith(fn: (a: ReturnType<typeof drillActions>) => void): DrillData {
  let state: DrillData = structuredClone(initialDrillData);
  let n = 0;
  const actions = drillActions(
    (f) => {
      state = { ...state, ...f(state) };
    },
    () => state,
    { now: () => new Date(2026, 10, 10, 12, n), newId: () => `id-${++n}` },
  );
  fn(actions);
  return state;
}

const day = (d: number) => `2026-10-${String(d).padStart(2, '0')}`;

describe('passport stamps', () => {
  it('stamps a rule once all three days are answered, dodges included', () => {
    const data = storeWith((a) => {
      a.start(day(1), '07:00');
      a.answer(a.openToday(day(1))!, 'done', 'five_minute');
      a.answer(a.openToday(day(2))!, 'dodged', 'uncomfortable');
      a.answer(a.openToday(day(3))!, 'done', 'daily');
      a.answer(a.openToday(day(4))!, 'dodged', 'five_minute'); // rule 2, day 1 of 3
    });
    expect(stampFor(data, 1)).toEqual({ ruleId: 1, done: 2 });
    expect(stampFor(data, 2)).toBeUndefined();
    expect(earnedStamps(data)).toEqual([{ ruleId: 1, done: 2 }]);
  });

  it('does not stamp while the third day is pending, and undo takes it back', () => {
    let id = '';
    const pending = storeWith((a) => {
      a.start(day(1), '07:00');
      a.answer(a.openToday(day(1))!, 'done', 'five_minute');
      a.answer(a.openToday(day(2))!, 'done', 'uncomfortable');
      id = a.openToday(day(3))!;
    });
    expect(stampFor(pending, 1)).toBeUndefined();

    const undone = storeWith((a) => {
      a.start(day(1), '07:00');
      a.answer(a.openToday(day(1))!, 'done', 'five_minute');
      a.answer(a.openToday(day(2))!, 'done', 'uncomfortable');
      const third = a.openToday(day(3))!;
      a.answer(third, 'done', 'daily');
      a.undo(third);
    });
    expect(stampFor(undone, 1)).toBeUndefined();
    expect(id).toBeTruthy();
  });

  it('has stamp art for all 15 rules', () => {
    for (const r of rules) expect(stampArt[r.number]).toBeDefined();
  });
});
