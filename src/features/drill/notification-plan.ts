// Local morning notifications (Expo Notifications schedules them; this file
// only decides what and when). Copy: title = rule title, body = the rule's
// mantra (CLAUDE.md §2). Both come from the card verbatim and contain no
// profanity, so no explicit-content filter is needed here.

import { getRule } from '@/content';

import { addDays, atTime, type LocalDate } from './local-date';
import { dayShownOn, type DrillRecord } from './progress';
import { spineDay } from './spine';

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
): PlannedNotification[] {
  const plan: PlannedNotification[] = [];
  for (let offset = 0; offset < PLAN_DAYS; offset++) {
    const date = addDays(today, offset);
    const fireAt = atTime(date, notifyAt);
    if (fireAt <= now) continue;
    const day = dayShownOn(records, today, date);
    if (day === undefined) break;
    // Already answered today: no reminder for a drill that's done.
    if (offset === 0 && records.some((r) => r.day === day && r.status !== 'pending' && r.scheduledFor === today)) {
      continue;
    }
    const rule = getRule(spineDay(day).ruleId);
    plan.push({ date, fireAt, day, title: rule.title, body: rule.mantra });
  }
  return plan;
}
