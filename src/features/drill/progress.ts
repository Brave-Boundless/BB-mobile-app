// What the Today screen shows, derived from the user's drill records.
//
// Progression model (Mark, 2026-11-06):
// one spine day per calendar day, and the next day unlocks only after the
// current one is answered (Did it / Dodged it). Missing calendar days never
// skips a drill and never counts against the user: they pick up where they
// left off.

import { SPINE_LENGTH } from './spine';
import type { LocalDate } from './local-date';

export type DrillStatus = 'pending' | 'done' | 'dodged';

export interface DrillRecord {
  day: number;
  scheduledFor: LocalDate;
  status: DrillStatus;
}

export type TodayState =
  /** A drill to answer. `isNew` = no record exists yet; create one for `day` on `today`. */
  | { kind: 'drill'; day: number; isNew: boolean }
  /** Today's drill is answered. Show the evening prompt; next day unlocks tomorrow. */
  | { kind: 'answered'; day: number; status: Exclude<DrillStatus, 'pending'> }
  /** All 45 answered on an earlier day. Day-45 wrap-up (build step 6). */
  | { kind: 'complete' };

export function todayState(records: readonly DrillRecord[], today: LocalDate): TodayState {
  const spine = records.filter((r) => r.day <= SPINE_LENGTH);
  if (spine.length === 0) return { kind: 'drill', day: 1, isNew: true };

  const latest = spine.reduce((a, b) => (b.day > a.day ? b : a));
  if (latest.status === 'pending') return { kind: 'drill', day: latest.day, isNew: false };
  if (latest.scheduledFor >= today) return { kind: 'answered', day: latest.day, status: latest.status };
  if (latest.day >= SPINE_LENGTH) return { kind: 'complete' };
  return { kind: 'drill', day: latest.day + 1, isNew: true };
}

/**
 * The spine day the user will see on `date`, assuming they do nothing
 * between now and then. Used to fill in notification copy ahead of time.
 */
export function dayShownOn(records: readonly DrillRecord[], today: LocalDate, date: LocalDate): number | undefined {
  const state = todayState(records, today);
  if (state.kind === 'complete') return undefined;
  if (state.kind === 'drill') return state.day;
  // Answered today: tomorrow onward shows the next day.
  if (date <= today) return state.day;
  return state.day < SPINE_LENGTH ? state.day + 1 : undefined;
}
