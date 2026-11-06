// What the Rules screens show about the user's own record. Pure functions over
// the local drill store.

import type { RuleId } from '@/content';
import { todayState } from '@/features/drill/progress';
import { DAYS_PER_RULE, SPINE_LENGTH, spineDay } from '@/features/drill/spine';
import type { DrillData, DrillDayRow, JournalRow } from '@/features/drill/store';
import type { LocalDate } from '@/features/drill/local-date';

export type RuleStatus =
  | { kind: 'current' }
  | { kind: 'notStarted'; startDay: number }
  | { kind: 'tally'; done: number; dodged: number };

/** First spine day of a rule: rule 1 → day 1, rule 4 → day 10. */
export function ruleStartDay(ruleId: RuleId): number {
  return (ruleId - 1) * DAYS_PER_RULE + 1;
}

/** The rule the user is on today, if they have started and not finished. */
export function currentRuleId(data: DrillData, today: LocalDate): RuleId | undefined {
  if (!data.startedOn) return undefined;
  const state = todayState(Object.values(data.drills), today);
  if (state.kind === 'complete') return undefined;
  return spineDay(Math.min(state.day, SPINE_LENGTH)).ruleId;
}

export function ruleStatus(data: DrillData, ruleId: RuleId, today: LocalDate): RuleStatus {
  if (currentRuleId(data, today) === ruleId) return { kind: 'current' };
  const rows = Object.values(data.drills).filter((d) => d.ruleId === ruleId && d.status !== 'pending');
  if (rows.length === 0) return { kind: 'notStarted', startDay: ruleStartDay(ruleId) };
  return {
    kind: 'tally',
    done: rows.filter((r) => r.status === 'done').length,
    dodged: rows.filter((r) => r.status === 'dodged').length,
  };
}

export interface HistoryEntry {
  drill: DrillDayRow;
  /** True when the user took the five-minute fallback on an uncomfortable/daily day. */
  tookFallback: boolean;
  report?: JournalRow;
}

/** The user's drills on one rule, oldest first, each with its report-back. */
export function ruleHistory(data: DrillData, ruleId: RuleId): HistoryEntry[] {
  const reports = Object.values(data.journal).filter((j) => !j.deleted);
  return Object.values(data.drills)
    .filter((d) => d.ruleId === ruleId)
    .sort((a, b) => a.day - b.day || a.scheduledFor.localeCompare(b.scheduledFor))
    .map((drill) => ({
      drill,
      tookFallback:
        drill.status !== 'pending' &&
        drill.day <= SPINE_LENGTH &&
        drill.tier === 'five_minute' &&
        spineDay(drill.day).tier !== 'five_minute',
      report: reports.find((j) => j.drillDayId === drill.id),
    }));
}

export const ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
