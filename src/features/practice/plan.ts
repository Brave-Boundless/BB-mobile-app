// After Day 45 (build step 6, decisions approved by Mark 2026-11-06):
// - Wrap-up: shown the morning after Day 45 until the user locks in choices.
// - Dodge pattern: up to 3 rules with the most spine dodges (ties: book order).
// - Restart: each chosen rule reruns five_minute → uncomfortable → daily, one
//   drill per day, waiting for an answer (same rule as the 45 days).
// - Daily set: every chosen rule, every day, as its daily drill. Once a week —
//   the weekday Day 45 was answered — it's the uncomfortable drill instead
//   ("weekly challenge"). A rule mid-restart sits out of the daily set.
// - Day numbers continue past 45: the first practice date is 46, and each new
//   calendar date with practice drills adds one. Missed dates add nothing.
//
// Type-only imports from the store: the store imports this module.

import { DRILL_TIERS, type DrillTier, type RuleId } from '@/content';
import type { DrillData, DrillDayRow, DrillKind, Practice } from '@/features/drill/store';

import { todayState } from '@/features/drill/progress';
import { SPINE_LENGTH } from '@/features/drill/spine';
import type { LocalDate } from '@/features/drill/local-date';

export const MAX_RESTART = 3;

const kindOf = (d: { kind?: DrillKind }): DrillKind => d.kind ?? 'spine';
const spineRows = (data: DrillData) => Object.values(data.drills).filter((d) => kindOf(d) === 'spine');
const practiceRows = (data: DrillData) => Object.values(data.drills).filter((d) => kindOf(d) !== 'spine');

/** All 45 answered (on an earlier day). */
export function spineComplete(data: DrillData, today: LocalDate): boolean {
  return !!data.startedOn && todayState(spineRows(data), today).kind === 'complete';
}

export function wrapupDue(data: DrillData, today: LocalDate): boolean {
  return spineComplete(data, today) && !data.practice;
}

export interface DodgeRow {
  ruleId: RuleId;
  dodged: number;
  answered: number;
}

export function dodgePattern(data: DrillData): DodgeRow[] {
  const by = new Map<RuleId, DodgeRow>();
  for (const d of spineRows(data)) {
    if (d.status === 'pending') continue;
    const row = by.get(d.ruleId) ?? { ruleId: d.ruleId, dodged: 0, answered: 0 };
    row.answered++;
    if (d.status === 'dodged') row.dodged++;
    by.set(d.ruleId, row);
  }
  return [...by.values()]
    .filter((r) => r.dodged > 0)
    .sort((a, b) => b.dodged - a.dodged || a.ruleId - b.ruleId)
    .slice(0, MAX_RESTART);
}

export function spineTally(data: DrillData): { done: number; dodged: number } {
  const rows = spineRows(data).filter((d) => d.day <= SPINE_LENGTH);
  return { done: rows.filter((d) => d.status === 'done').length, dodged: rows.filter((d) => d.status === 'dodged').length };
}

/** The ordered restart drills: rule × (five_minute, uncomfortable, daily). */
export function restartSequence(rules: readonly RuleId[]): { ruleId: RuleId; tier: DrillTier }[] {
  return rules.flatMap((ruleId) => DRILL_TIERS.map((tier) => ({ ruleId, tier })));
}

/** Weekday (0-6) Day 45 was answered on; the weekly challenge falls on it. */
export function challengeWeekday(data: DrillData): number | undefined {
  const d45 = spineRows(data).find((d) => d.day === SPINE_LENGTH && d.status !== 'pending');
  if (!d45) return undefined;
  const [y, m, d] = d45.scheduledFor.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

function weekday(date: LocalDate): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export interface PracticeSlot {
  kind: 'restart' | 'daily';
  ruleId: RuleId;
  tier: DrillTier;
  weekly: boolean;
  /** Existing row for this slot, if already created. */
  row?: DrillDayRow;
}

export interface PracticeDay {
  day: number;
  slots: PracticeSlot[];
  /** Restart position (1-based) and length, while a restart is running. */
  restart?: { index: number; total: number };
  /** True on the first practice day after the restart finished. */
  restartDone: boolean;
}

/** What Today shows after Day 45. Undefined before the wrap-up is locked in. */
export function practiceToday(data: DrillData, today: LocalDate): PracticeDay | undefined {
  const practice: Practice | null = data.practice;
  if (!practice || !spineComplete(data, today)) return undefined;

  const rows = practiceRows(data);
  const todays = rows.filter((r) => r.scheduledFor === today);

  // Day number: today's if rows exist, else one past the number of earlier practice dates.
  const earlierDates = new Set(rows.filter((r) => r.scheduledFor < today).map((r) => r.scheduledFor));
  const day = todays[0]?.day ?? SPINE_LENGTH + earlierDates.size + 1;

  // Restart track: like the spine, one at a time, waiting for an answer.
  const seq = restartSequence(practice.restartRules);
  const restartRows = rows.filter((r) => kindOf(r) === 'restart').sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor) || a.updatedAt.localeCompare(b.updatedAt));
  const answered = restartRows.filter((r) => r.status !== 'pending');
  const pending = restartRows.find((r) => r.status === 'pending');
  const answeredToday = answered.find((r) => r.scheduledFor === today);

  const slots: PracticeSlot[] = [];
  let restart: PracticeDay['restart'];
  let restartingRule: RuleId | undefined;

  if (answeredToday) {
    slots.push({ kind: 'restart', ruleId: answeredToday.ruleId, tier: answeredToday.tier, weekly: false, row: answeredToday });
    restart = { index: Math.floor((answered.length - 1) / 3) + 1, total: practice.restartRules.length };
    restartingRule = answeredToday.ruleId;
  } else if (answered.length < seq.length) {
    const step = seq[answered.length];
    slots.push({ kind: 'restart', ruleId: step.ruleId, tier: step.tier, weekly: false, row: pending });
    restart = { index: Math.floor(answered.length / 3) + 1, total: practice.restartRules.length };
    restartingRule = step.ruleId;
  }
  // "Restart done" shows on the first practice day after the last restart answer, then goes away.
  const lastRestart = answered.at(-1)?.scheduledFor;
  const restartDone =
    seq.length > 0 &&
    answered.length >= seq.length &&
    !answeredToday &&
    !!lastRestart &&
    !rows.some((r) => r.scheduledFor > lastRestart && r.scheduledFor < today);

  const weeklyDay = challengeWeekday(data);
  const isChallenge = weeklyDay !== undefined && weekday(today) === weeklyDay && today > practice.startedOn;
  for (const ruleId of practice.dailySet) {
    if (ruleId === restartingRule) continue;
    const row = todays.find((r) => kindOf(r) === 'daily' && r.ruleId === ruleId);
    const tier: DrillTier = row?.tier ?? (isChallenge ? 'uncomfortable' : 'daily');
    slots.push({ kind: 'daily', ruleId, tier, weekly: tier === 'uncomfortable', row });
  }

  return { day, slots, restart, restartDone };
}
