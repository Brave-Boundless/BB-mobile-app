import { describe, expect, it } from '@jest/globals';

import { drillActions, initialDrillData, type DrillData } from '@/features/drill/store';

import { currentRuleId, ruleHistory, ruleStartDay, ruleStatus } from '../history';

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

describe('rule history', () => {
  it('knows where each rule starts', () => {
    expect([1, 2, 4, 15].map((r) => ruleStartDay(r as 1))).toEqual([1, 4, 10, 43]);
  });

  it('reports not started, current and tallies', () => {
    const data = storeWith((a) => {
      a.start(day(1), '07:00');
      a.answer(a.openToday(day(1))!, 'done', 'five_minute'); // R1 D1
      a.answer(a.openToday(day(2))!, 'dodged', 'uncomfortable'); // R1 D2
      a.answer(a.openToday(day(3))!, 'done', 'daily'); // R1 D3
      a.openToday(day(4)); // R2 D4 pending
    });
    expect(currentRuleId(data, day(4))).toBe(2);
    expect(ruleStatus(data, 1, day(4))).toEqual({ kind: 'tally', done: 2, dodged: 1 });
    expect(ruleStatus(data, 2, day(4))).toEqual({ kind: 'current' });
    expect(ruleStatus(data, 3, day(4))).toEqual({ kind: 'notStarted', startDay: 7 });
  });

  it('nobody is current before starting', () => {
    expect(currentRuleId(initialDrillData, day(1))).toBeUndefined();
    expect(ruleStatus(initialDrillData, 1, day(1))).toEqual({ kind: 'notStarted', startDay: 1 });
  });

  it('lists history oldest first with fallback flag and report', () => {
    const data = storeWith((a) => {
      a.start(day(1), '07:00');
      a.answer(a.openToday(day(1))!, 'done', 'five_minute');
      const d2 = a.openToday(day(2))!;
      a.answer(d2, 'done', 'five_minute'); // fallback on the uncomfortable day
      a.saveReport(d2, 'Short and honest.');
    });
    const h = ruleHistory(data, 1);
    expect(h.map((e) => e.drill.day)).toEqual([1, 2]);
    expect(h.map((e) => e.tookFallback)).toEqual([false, true]);
    expect(h[1].report?.body).toBe('Short and honest.');
    expect(h[0].report).toBeUndefined();
  });
});
