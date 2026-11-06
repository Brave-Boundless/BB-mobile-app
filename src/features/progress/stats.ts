// Numbers for the Progress tab, derived from the local drill store.

import { getRule, rules, type RuleId } from '@/content';
import type { LocalDate } from '@/features/drill/local-date';
import { todayState } from '@/features/drill/progress';
import { SPINE_LENGTH } from '@/features/drill/spine';
import type { DrillData, DrillDayRow } from '@/features/drill/store';

export type Shade = 'all' | 'most' | 'some' | 'none';

export interface RuleTally {
  ruleId: RuleId;
  done: number;
  answered: number;
  shade: Shade;
}

export type Position =
  | { kind: 'notStarted' }
  | { kind: 'day'; day: number }
  | { kind: 'complete' };

const answeredSpine = (data: DrillData): DrillDayRow[] =>
  Object.values(data.drills).filter((d) => d.day <= SPINE_LENGTH && d.status !== 'pending');

export function position(data: DrillData, today: LocalDate): Position {
  if (!data.startedOn) return { kind: 'notStarted' };
  const state = todayState(Object.values(data.drills), today);
  return state.kind === 'complete' ? { kind: 'complete' } : { kind: 'day', day: state.day };
}

/**
 * Did-its in a row, in drill order. A dodge resets it; missed calendar days
 * don't (the next drill waits). Mark, 2026-11-06.
 */
export function streak(data: DrillData): number {
  const answered = answeredSpine(data).sort((a, b) => b.day - a.day);
  let n = 0;
  for (const d of answered) {
    if (d.status !== 'done') break;
    n++;
  }
  return n;
}

/** Mantra shown under a live streak: the rule of the most recent Did it. */
export function streakMantra(data: DrillData): string | undefined {
  const last = answeredSpine(data)
    .filter((d) => d.status === 'done')
    .sort((a, b) => b.day - a.day)[0];
  return last ? getRule(last.ruleId).mantra : undefined;
}

export function shadeFor(done: number, answered: number): Shade {
  if (answered === 0) return 'none';
  if (done === answered) return 'all';
  return done / answered >= 0.5 ? 'most' : 'some';
}

export function ruleTallies(data: DrillData): RuleTally[] {
  const answered = answeredSpine(data);
  return rules.map((r) => {
    const mine = answered.filter((d) => d.ruleId === r.number);
    const done = mine.filter((d) => d.status === 'done').length;
    return { ruleId: r.number, done, answered: mine.length, shade: shadeFor(done, mine.length) };
  });
}
