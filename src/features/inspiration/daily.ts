// Which book passage Today shows (build step 8). Pure functions over the store.
//
// Morning: one of the current rule's morning passages, a different one on each
// of the rule's three days. After a dodge with a reason (Mark, 2026-11-07), the
// next morning's passage is one tagged for that reason instead, from any rule.
// Evening: the rule's evening passage, after the report-back.
// Passages are shown verbatim; explicit ones are fine in the app.

import { passages, type Passage, type RuleId, type Situation } from '@/content';
import type { LocalDate } from '@/features/drill/local-date';
import { kindOf, type DodgeReason, type DrillData } from '@/features/drill/store';

/** Dodge reason → the passage tag that speaks to it. "Something else" has none. */
export const REASON_SITUATION: Partial<Record<DodgeReason, Situation>> = {
  fear: 'fear',
  point: 'stalling',
  time: 'work',
  forgot: 'momentum',
};

function dayHash(date: LocalDate): number {
  let h = 0;
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** The most recent dodge reason from before today, if the last answer before today was a dodge. */
export function lastDodgeReason(data: Pick<DrillData, 'drills'>, today: LocalDate): DodgeReason | undefined {
  const before = Object.values(data.drills)
    .filter((d) => d.status !== 'pending' && d.scheduledFor < today)
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor) || (a.respondedAt ?? '').localeCompare(b.respondedAt ?? ''));
  const last = before[before.length - 1];
  return last?.status === 'dodged' ? (last.dodgeReason ?? undefined) : undefined;
}

export interface DailyPassage {
  passage: Passage;
  /** Set when the pick follows a dodge reason rather than the rule. */
  because?: DodgeReason;
}

/**
 * This morning's passage. `ruleId` is the rule on Today; `day` is the drill's
 * day number (1-45+), so a rule's three days get three different passages.
 */
export function morningPassage(
  data: Pick<DrillData, 'drills'>,
  today: LocalDate,
  ruleId: RuleId,
  day: number,
): DailyPassage | undefined {
  const reason = lastDodgeReason(data, today);
  const tag = reason ? REASON_SITUATION[reason] : undefined;
  if (tag) {
    const pool = passages.filter((p) => p.use !== 'exercise' && p.situations.includes(tag));
    if (pool.length) return { passage: pool[dayHash(today) % pool.length], because: reason };
  }
  const pool = passages.filter((p) => p.rule === ruleId && p.use === 'morning');
  if (!pool.length) return undefined;
  return { passage: pool[(day - 1) % pool.length] };
}

/** The evening passage for a rule (rotates if the rule has more than one). */
export function eveningPassage(ruleId: RuleId, day: number): Passage | undefined {
  const pool = passages.filter((p) => p.rule === ruleId && p.use === 'evening');
  return pool.length ? pool[(day - 1) % pool.length] : undefined;
}

/** The rule Today is about: the open or just-answered spine drill, else the first practice drill. */
export function todayRule(data: Pick<DrillData, 'drills'>, today: LocalDate): { ruleId: RuleId; day: number } | undefined {
  const rows = Object.values(data.drills).filter((d) => d.scheduledFor === today);
  const row = rows.find((d) => kindOf(d) === 'spine') ?? rows.sort((a, b) => a.ruleId - b.ruleId)[0];
  return row ? { ruleId: row.ruleId, day: row.day } : undefined;
}
