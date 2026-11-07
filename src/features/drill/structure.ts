// The shape of the 45 days, made visible (Mark, 2026-11-07): 15 rules x 3
// drills. Pure helpers over the drill store.

import type { RuleId } from '@/content';

import type { DrillStatus } from './progress';
import { DAYS_PER_RULE, SPINE_LENGTH } from './spine';
import { kindOf, type DrillData } from './store';

/** One pip: a spine drill's state. `current` = today's unanswered drill. */
export type PipState = 'done' | 'dodged' | 'current' | 'ahead';

/** Spine status by day number (1-45). Practice rows are ignored. */
export function spineStatuses(data: Pick<DrillData, 'drills'>): Map<number, DrillStatus> {
  const out = new Map<number, DrillStatus>();
  for (const d of Object.values(data.drills)) {
    if (kindOf(d) === 'spine' && d.day <= SPINE_LENGTH) out.set(d.day, d.status);
  }
  return out;
}

/** The three pips for a rule, in tier order. */
export function rulePips(data: Pick<DrillData, 'drills'>, ruleId: RuleId): [PipState, PipState, PipState] {
  const statuses = spineStatuses(data);
  const first = (ruleId - 1) * DAYS_PER_RULE + 1;
  return [0, 1, 2].map((i) => {
    const s = statuses.get(first + i);
    return s === 'done' ? 'done' : s === 'dodged' ? 'dodged' : s === 'pending' ? 'current' : 'ahead';
  }) as [PipState, PipState, PipState];
}

/** Spine drills answered (done or dodged), 0-45. */
export function answeredCount(data: Pick<DrillData, 'drills'>): number {
  let n = 0;
  for (const s of spineStatuses(data).values()) if (s !== 'pending') n += 1;
  return n;
}

/** All 45 pips, rule by rule: for the first-run grid and Progress. */
export function allPips(data: Pick<DrillData, 'drills'>): PipState[][] {
  return Array.from({ length: SPINE_LENGTH / DAYS_PER_RULE }, (_, i) => rulePips(data, (i + 1) as RuleId));
}
