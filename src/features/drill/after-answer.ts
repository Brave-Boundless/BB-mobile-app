// What Today offers after an answer (build step 7): the dodge pattern, the
// note that comes back, and tomorrow's planned reminder. Pure functions.

import { getRule, type RuleId } from '@/content';

import { addDays, atTime, type LocalDate } from './local-date';
import { dayShownOn } from './progress';
import { spineDay } from './spine';
import { kindOf, type DodgeReason, type DrillData, type JournalRow } from './store';

/** Times behind the plan buttons. "Pick a time" opens the time picker. */
export const PLAN_TIMES = { morning: '08:00', midday: '12:30', evening: '18:30' } as const;

/**
 * Most common reason across all dodges, once there are at least 3 reasons
 * logged and one reason leads outright. Undefined otherwise.
 */
export function dodgePattern(data: Pick<DrillData, 'drills'>): { reason: DodgeReason; count: number } | undefined {
  const counts = new Map<DodgeReason, number>();
  let total = 0;
  for (const d of Object.values(data.drills)) {
    if (d.status !== 'dodged' || !d.dodgeReason) continue;
    counts.set(d.dodgeReason, (counts.get(d.dodgeReason) ?? 0) + 1);
    total += 1;
  }
  if (total < 3) return undefined;
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return undefined;
  return { reason: ranked[0][0], count: ranked[0][1] };
}

const MIN_AGE_DAYS = 7;

/** A day-stable pick: the same entry all day, a different one on another day. */
function dayIndex(today: LocalDate, n: number): number {
  let h = 0;
  for (const c of today) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % n;
}

/**
 * "On Day N you wrote": a report-back at least 7 days old, at most one a day.
 * Keeps today's pick if one was already shown; otherwise picks a new one.
 */
export function lookBackFor(
  data: Pick<DrillData, 'drills' | 'journal' | 'lookBack'>,
  today: LocalDate,
): { entry: JournalRow; day: number; isNew: boolean } | undefined {
  const cutoff = addDays(today, -MIN_AGE_DAYS);
  const old = Object.values(data.journal)
    .filter((j) => !j.deleted && j.createdAt.slice(0, 10) <= cutoff && data.drills[j.drillDayId])
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (old.length === 0) return undefined;
  if (data.lookBack?.on === today) {
    const kept = old.find((j) => j.id === data.lookBack!.journalId);
    return kept ? { entry: kept, day: data.drills[kept.drillDayId].day, isNew: false } : undefined;
  }
  const entry = old[dayIndex(today, old.length)];
  return { entry, day: data.drills[entry.drillDayId].day, isNew: true };
}

/** The planned-time reminder, if one is set for a future time and that day's drill is still open. */
export function planReminder(
  data: Pick<DrillData, 'drills' | 'plan'>,
  now: Date,
  today: LocalDate,
  body: string,
): { fireAt: Date; title: string; body: string } | undefined {
  const plan = data.plan;
  if (!plan || plan.forDate < today) return undefined;
  const fireAt = atTime(plan.forDate, plan.at);
  if (fireAt <= now) return undefined;
  const spine = Object.values(data.drills).filter((d) => kindOf(d) === 'spine');
  const day = dayShownOn(spine, today, plan.forDate);
  if (day === undefined) return undefined;
  if (spine.some((d) => d.day === day && d.status !== 'pending' && d.scheduledFor === plan.forDate)) return undefined;
  return { fireAt, title: getRule(spineDay(day).ruleId).title, body };
}

/** Recap after a rule's third spine drill is answered. */
export interface RuleRecap {
  ruleId: RuleId;
  done: number;
  dodged: number;
  /** Highest rating given on this rule's done drills, 1-5. */
  hardest?: number;
  notes: { day: number; body: string }[];
  next?: RuleId;
}

export function ruleRecap(data: Pick<DrillData, 'drills' | 'journal'>, ruleId: RuleId): RuleRecap | undefined {
  const rows = Object.values(data.drills)
    .filter((d) => kindOf(d) === 'spine' && d.ruleId === ruleId && d.day <= 45)
    .sort((a, b) => a.day - b.day);
  if (rows.length < 3 || rows.some((r) => r.status === 'pending')) return undefined;
  const efforts = rows.map((r) => r.effort ?? 0).filter((e) => e > 0);
  const notes = rows.flatMap((r) => {
    const j = Object.values(data.journal).find((x) => x.drillDayId === r.id && !x.deleted);
    return j ? [{ day: r.day, body: j.body }] : [];
  });
  return {
    ruleId,
    done: rows.filter((r) => r.status === 'done').length,
    dodged: rows.filter((r) => r.status === 'dodged').length,
    hardest: efforts.length ? Math.max(...efforts) : undefined,
    notes,
    next: ruleId < 15 ? ((ruleId + 1) as RuleId) : undefined,
  };
}

/**
 * "Rule 2 felt brutal on Day 5. Its daily drill felt fine." For one rule: the
 * hardest-rated five-minute/uncomfortable spine drill against the latest
 * rated daily drill (spine or practice). Undefined until both exist.
 */
export function effortTrend(
  data: Pick<DrillData, 'drills'>,
  ruleId: RuleId,
): { ruleId: RuleId; first: number; firstDay: number; last: number } | undefined {
  const rows = Object.values(data.drills).filter((d) => d.ruleId === ruleId && d.status === 'done' && d.effort);
  const early = rows
    .filter((d) => kindOf(d) === 'spine' && d.tier !== 'daily')
    .sort((a, b) => (b.effort ?? 0) - (a.effort ?? 0) || a.day - b.day)[0];
  const daily = rows.filter((d) => d.tier === 'daily').sort((a, b) => b.day - a.day)[0];
  if (!early || !daily) return undefined;
  return { ruleId, first: early.effort!, firstDay: early.day, last: daily.effort! };
}

/** True once any done drill has a rating. */
export function anyRated(data: Pick<DrillData, 'drills'>): boolean {
  return Object.values(data.drills).some((d) => d.status === 'done' && !!d.effort);
}
