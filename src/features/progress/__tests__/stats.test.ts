import { describe, expect, it } from '@jest/globals';

import { drillActions, initialDrillData, type DrillData } from '@/features/drill/store';

import { position, ruleTallies, shadeFor, streak, streakMantra } from '../stats';

type Outcome = 'done' | 'dodged';
const date = (i: number) => new Date(2026, 8, 1 + i).toISOString().slice(0, 10);

/** Answers spine days 1..n with the given outcomes, one per calendar day (with gaps allowed). */
function play(outcomes: Outcome[], gapEvery = 0): DrillData {
  let state: DrillData = structuredClone(initialDrillData);
  let n = 0;
  const a = drillActions(
    (f) => {
      state = { ...state, ...f(state) };
    },
    () => state,
    { now: () => new Date(2026, 8, 1, 0, n), newId: () => `id-${++n}` },
  );
  a.start(date(0), '07:00');
  let cal = 0;
  outcomes.forEach((o, i) => {
    const id = a.openToday(date(cal))!;
    a.answer(id, o, 'five_minute');
    cal += 1 + (gapEvery && (i + 1) % gapEvery === 0 ? 3 : 0);
  });
  return state;
}

describe('progress stats', () => {
  it('position: not started, day N, complete', () => {
    expect(position(initialDrillData, date(0))).toEqual({ kind: 'notStarted' });
    expect(position(play(['done', 'done']), date(2))).toEqual({ kind: 'day', day: 3 });
    expect(position(play(Array(45).fill('done')), date(60))).toEqual({ kind: 'complete' });
  });

  it('streak counts Did-its in a row; a dodge resets; missed days do not', () => {
    expect(streak(initialDrillData)).toBe(0);
    expect(streak(play(['done', 'dodged', 'done', 'done']))).toBe(2);
    expect(streak(play(['done', 'done', 'dodged']))).toBe(0);
    expect(streak(play(['done', 'done', 'done', 'done'], 1))).toBe(4); // 3-day gaps between each
  });

  it('streak mantra comes from the rule of the last Did it', () => {
    expect(streakMantra(play(['done', 'done', 'done', 'done']))).toBe('Clarity now saves carnage later.'); // day 4 = rule 2
    expect(streakMantra(initialDrillData)).toBeUndefined();
  });

  it('shades by completion rate', () => {
    expect([shadeFor(0, 0), shadeFor(3, 3), shadeFor(2, 3), shadeFor(1, 2), shadeFor(1, 3), shadeFor(0, 2)]).toEqual([
      'none',
      'all',
      'most',
      'most',
      'some',
      'some',
    ]);
  });

  it('tallies all 15 rules from spine answers', () => {
    const t = ruleTallies(play(['done', 'dodged', 'done', 'dodged', 'dodged', 'dodged']));
    expect(t).toHaveLength(15);
    expect(t[0]).toEqual({ ruleId: 1, done: 2, answered: 3, shade: 'most' });
    expect(t[1]).toEqual({ ruleId: 2, done: 0, answered: 3, shade: 'some' });
    expect(t[2]).toEqual({ ruleId: 3, done: 0, answered: 0, shade: 'none' });
  });
});
