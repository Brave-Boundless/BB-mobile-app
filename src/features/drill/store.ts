// Local-first drill + journal store (Zustand, persisted to AsyncStorage).
//
// The phone is the source of truth until the user signs in (accounts are
// optional at start — CLAUDE.md decisions log). Every write marks the row
// `dirty`; sync.ts pushes dirty rows to Supabase when a session exists.
// Row ids are UUIDs generated here, so the same id is used on the server.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DrillTier, RuleId } from '@/content';

import type { LocalDate } from './local-date';
import { todayState, type DrillStatus } from './progress';
import { spineDay } from './spine';

export interface DrillDayRow {
  id: string;
  day: number;
  ruleId: RuleId;
  /** The tier actually shown when answered: five_minute if the user took the fallback. */
  tier: DrillTier;
  scheduledFor: LocalDate;
  status: DrillStatus;
  respondedAt: string | null;
  updatedAt: string;
  dirty: boolean;
}

export interface JournalRow {
  id: string;
  drillDayId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  dirty: boolean;
  /** Tombstone: removed locally, still to be deleted on the server. */
  deleted: boolean;
}

export interface DrillData {
  startedOn: LocalDate | null;
  notifyAt: string; // 'HH:MM' local
  notificationsAsked: boolean;
  /** Drill ids whose evening prompt the user skipped. */
  reportSkipped: Record<string, true>;
  drills: Record<string, DrillDayRow>;
  journal: Record<string, JournalRow>;
}

export interface DrillActions {
  start(today: LocalDate, notifyAt: string): void;
  setNotifyAt(hhmm: string): void;
  markNotificationsAsked(): void;
  /** Returns the id of the drill to show today, creating a pending row if needed. Undefined after day 45. */
  openToday(today: LocalDate): string | undefined;
  answer(id: string, status: Exclude<DrillStatus, 'pending'>, tier: DrillTier): void;
  undo(id: string): void;
  saveReport(drillDayId: string, body: string): void;
  skipReport(drillDayId: string): void;
  /** Clears `dirty` only on rows unchanged since they were sent (updatedAt matches). */
  markSynced(sent: SyncedRows): void;
  reset(): void;
}

export interface SyncedRows {
  drills: { id: string; updatedAt: string }[];
  journal: { id: string; updatedAt: string }[];
}

export type DrillStore = DrillData & DrillActions;

export const initialDrillData: DrillData = {
  startedOn: null,
  notifyAt: '07:00',
  notificationsAsked: false,
  reportSkipped: {},
  drills: {},
  journal: {},
};

export interface StoreDeps {
  now: () => Date;
  newId: () => string;
}

const defaultDeps: StoreDeps = { now: () => new Date(), newId: randomUUID };

/** Builds the store logic. Exported separately so tests can inject time and ids. */
export function drillActions(
  set: (fn: (s: DrillData) => Partial<DrillData>) => void,
  get: () => DrillData,
  deps: StoreDeps = defaultDeps,
): DrillActions {
  const stamp = () => deps.now().toISOString();

  return {
    start(today, notifyAt) {
      set((s) => ({ startedOn: s.startedOn ?? today, notifyAt }));
    },

    setNotifyAt(hhmm) {
      set(() => ({ notifyAt: hhmm }));
    },

    markNotificationsAsked() {
      set(() => ({ notificationsAsked: true }));
    },

    openToday(today) {
      const records = Object.values(get().drills);
      const state = todayState(records, today);
      if (state.kind === 'complete') return undefined;
      if (state.kind === 'drill' && state.isNew) {
        const entry = spineDay(state.day);
        const row: DrillDayRow = {
          id: deps.newId(),
          day: entry.day,
          ruleId: entry.ruleId,
          tier: entry.tier,
          scheduledFor: today,
          status: 'pending',
          respondedAt: null,
          updatedAt: stamp(),
          dirty: true,
        };
        set((s) => ({ drills: { ...s.drills, [row.id]: row } }));
        return row.id;
      }
      // Existing row for this spine day. A pending drill carried over from an
      // earlier date moves to today so it is answered "today".
      const row = records.find((r) => r.day === state.day && r.day <= 45)!;
      if (row.status === 'pending' && row.scheduledFor !== today) {
        set((s) => ({
          drills: { ...s.drills, [row.id]: { ...row, scheduledFor: today, updatedAt: stamp(), dirty: true } },
        }));
      }
      return row.id;
    },

    answer(id, status, tier) {
      set((s) => {
        const row = s.drills[id];
        if (!row) return {};
        return {
          drills: {
            ...s.drills,
            [id]: { ...row, status, tier, respondedAt: stamp(), updatedAt: stamp(), dirty: true },
          },
        };
      });
    },

    undo(id) {
      set((s) => {
        const row = s.drills[id];
        if (!row) return {};
        const spineTier = row.day <= 45 ? spineDay(row.day).tier : row.tier;
        // The report-back answered "what did it cost / what did you learn" for
        // the old answer, so it goes too.
        const journal = { ...s.journal };
        for (const j of Object.values(journal)) {
          if (j.drillDayId === id && !j.deleted) journal[j.id] = { ...j, deleted: true, dirty: true, updatedAt: stamp() };
        }
        return {
          drills: {
            ...s.drills,
            [id]: { ...row, status: 'pending', tier: spineTier, respondedAt: null, updatedAt: stamp(), dirty: true },
          },
          journal,
        };
      });
    },

    saveReport(drillDayId, body) {
      set((s) => {
        const existing = Object.values(s.journal).find((j) => j.drillDayId === drillDayId && !j.deleted);
        const at = stamp();
        const row: JournalRow = existing
          ? { ...existing, body, updatedAt: at, dirty: true }
          : { id: deps.newId(), drillDayId, body, createdAt: at, updatedAt: at, dirty: true, deleted: false };
        return { journal: { ...s.journal, [row.id]: row } };
      });
    },

    skipReport(drillDayId) {
      set((s) => ({ reportSkipped: { ...s.reportSkipped, [drillDayId]: true } }));
    },

    markSynced(sent) {
      set((s) => {
        const drills = { ...s.drills };
        for (const { id, updatedAt } of sent.drills) {
          const d = drills[id];
          if (d && d.updatedAt === updatedAt) drills[id] = { ...d, dirty: false };
        }
        const journal = { ...s.journal };
        for (const { id, updatedAt } of sent.journal) {
          const j = journal[id];
          if (!j || j.updatedAt !== updatedAt) continue;
          if (j.deleted) delete journal[id];
          else journal[id] = { ...j, dirty: false };
        }
        return { drills, journal };
      });
    },

    reset() {
      set(() => ({ ...initialDrillData }));
    },
  };
}

export const useDrillStore = create<DrillStore>()(
  persist(
    (set, get) => ({
      ...initialDrillData,
      ...drillActions((fn) => set((s) => fn(s)), get),
    }),
    {
      name: 'bb.drills.v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ startedOn, notifyAt, notificationsAsked, reportSkipped, drills, journal }) => ({
        startedOn,
        notifyAt,
        notificationsAsked,
        reportSkipped,
        drills,
        journal,
      }),
    },
  ),
);

/** Report-back for a drill, if any. */
export function reportFor(data: DrillData, drillDayId: string): JournalRow | undefined {
  return Object.values(data.journal).find((j) => j.drillDayId === drillDayId && !j.deleted);
}
