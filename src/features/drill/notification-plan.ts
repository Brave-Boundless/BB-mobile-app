// Local morning notifications (Expo Notifications schedules them; this file
// only decides what and when). Copy: title = rule title, body = the rule's
// mantra (CLAUDE.md §2). Both come from the card verbatim and contain no
// profanity, so no explicit-content filter is needed here.

import { getRule } from '@/content';
import { practiceToday } from '@/features/practice/plan';

import { addDays, atTime, type LocalDate } from './local-date';
import { dayShownOn, type DrillRecord } from './progress';
import { spineDay } from './spine';
import type { DrillData } from './store';

/** How far ahead to schedule. Re-planned on every answer and app open. */
export const PLAN_DAYS = 7;

export interface PlannedNotification {
  date: LocalDate;
  fireAt: Date;
  day: number;
  title: string;
  body: string;
}

export function planMorningNotifications(
  records: readonly DrillRecord[],
  now: Date,
  today: LocalDate,
  notifyAt: string, // 'HH:MM' local
  /** Full local data; after Day 45 it supplies the restart / daily-set rule for each morning. */
  data?: DrillData,
): PlannedNotification[] {
  const plan: PlannedNotification[] = [];
  for (let offset = 0; offset < PLAN_DAYS; offset++) {
    const date = addDays(today, offset);
    const fireAt = atTime(date, notifyAt);
    if (fireAt <= now) continue;
    const day = dayShownOn(records, today, date);
    if (day === undefined) {
      // After Day 45: the restart rule while one runs, else rotate through the daily set.
      const p = data ? practiceToday(data, date) : undefined;
      if (!p || p.slots.length === 0) continue;
      if (offset === 0 && p.slots.every((s) => s.row && s.row.status !== 'pending')) continue;
      const slot = p.slots[0].kind === 'restart' ? p.slots[0] : p.slots[(p.day + offset) % p.slots.length];
      const rule = getRule(slot.ruleId);
      plan.push({ date, fireAt, day: p.day, title: rule.title, body: rule.mantra });
      continue;
    }
    // Already answered today: no reminder for a drill that's done.
    if (offset === 0 && records.some((r) => r.day === day && r.status !== 'pending' && r.scheduledFor === today)) {
      continue;
    }
    const rule = getRule(spineDay(day).ruleId);
    plan.push({ date, fireAt, day, title: rule.title, body: rule.mantra });
  }
  return plan;
}
