import type { RuleId } from '@/content';
import type { DrillData, DrillDayRow, JournalRow } from '@/features/drill/store';

export interface JournalItem {
  entry: JournalRow;
  /** The drill a report-back answers; undefined for a free note. */
  drill?: DrillDayRow;
}

/**
 * Report-backs and free notes, newest first. Filtered to one rule, only that
 * rule's report-backs. A report-back whose drill is gone is skipped.
 */
export function journalItems(data: DrillData, ruleId?: RuleId): JournalItem[] {
  return Object.values(data.journal)
    .filter((j) => !j.deleted)
    .map((entry) => ({ entry, drill: entry.drillDayId ? data.drills[entry.drillDayId] : undefined }))
    .filter((i) => (i.entry.drillDayId ? !!i.drill : true))
    .filter((i) => ruleId === undefined || (!!i.drill && i.drill.ruleId === ruleId))
    .sort((a, b) => b.entry.createdAt.localeCompare(a.entry.createdAt));
}

/** "Thu, Nov 6" in the user's locale. */
export function formatEntryDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
