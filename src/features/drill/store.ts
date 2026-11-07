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
import { practiceToday } from '@/features/practice/plan';

/** Which track a drill belongs to. Missing = 'spine' (rows saved before step 6). */
export type DrillKind = 'spine' | 'restart' | 'daily';

export const kindOf = (d: { kind?: DrillKind }): DrillKind => d.kind ?? 'spine';

/** The user's choices at the Day-45 wrap-up. */
export interface Practice {
  /** Rules kept as recurring daily drills. */
  dailySet: RuleId[];
  /** Up to 3 dodged rules to rerun, 3 days each, in this order. */
  restartRules: RuleId[];
  /** Date the wrap-up was locked in. */
  startedOn: LocalDate;
}

/** "How hard was it?" after Did it: 1 Easy … 5 Brutal. */
export type Effort = 1 | 2 | 3 | 4 | 5;

/** "What got in the way?" after Dodged it. */
export const DODGE_REASONS = ['fear', 'time', 'forgot', 'point', 'other'] as const;
export type DodgeReason = (typeof DODGE_REASONS)[number];

/** Tomorrow's planned time (a local reminder at that time). */
export interface DrillPlan {
  forDate: LocalDate;
  at: string; // 'HH:MM' local
}

export interface DrillDayRow {
  id: string;
  kind?: DrillKind;
  day: number;
  ruleId: RuleId;
  /** The tier actually shown when answered: five_minute if the user took the fallback. */
  tier: DrillTier;
  scheduledFor: LocalDate;
  status: DrillStatus;
  respondedAt: string | null;
  /** Done drills only. Missing on rows saved before step 7. */
  effort?: Effort | null;
  /** Dodged drills only. Missing on rows saved before step 7. */
  dodgeReason?: DodgeReason | null;
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
  /** Drill ids whose "How hard was it?" / "What got in the way?" the user skipped. */
  askSkipped: Record<string, true>;
  drills: Record<string, DrillDayRow>;
  journal: Record<string, JournalRow>;
  /** Null until the Day-45 wrap-up is locked in. */
  practice: Practice | null;
  /** Practice changed locally and not yet saved on the server. */
  practiceDirty: boolean;
  /** Tomorrow's planned time, if the reader set one. Local to this phone. */
  plan: DrillPlan | null;
  /** Date the last "On Day N you wrote" was shown, and which entry. */
  lookBack: { on: LocalDate; journalId: string } | null;
}

export interface DrillActions {
  start(today: LocalDate, notifyAt: string): void;
  setNotifyAt(hhmm: string): void;
  markNotificationsAsked(): void;
  /** Returns the id of the drill to show today, creating a pending row if needed. Undefined after day 45. */
  openToday(today: LocalDate): string | undefined;
  answer(id: string, status: Exclude<DrillStatus, 'pending'>, tier: DrillTier): void;
  undo(id: string): void;
  /** Done drills: how hard it was. Null clears it. */
  rate(id: string, effort: Effort | null): void;
  /** Dodged drills: what got in the way. Null clears it. */
  setDodgeReason(id: string, reason: DodgeReason | null): void;
  setPlan(plan: DrillPlan | null): void;
  setLookBack(v: { on: LocalDate; journalId: string }): void;
  skipAsk(id: string): void;
  saveReport(drillDayId: string, body: string): void;
  skipReport(drillDayId: string): void;
  deleteReport(journalId: string): void;
  /** Locks in (or edits) the post-Day-45 choices. */
  setPractice(p: Practice): void;
  /** Creates today's restart/daily-set rows if missing. Returns their ids. */
  ensurePracticeToday(today: LocalDate): string[];
  markPracticeSynced(sent: Practice): void;
  /** Brings server history onto this phone after sign-in. See mergeServerRows. */
  mergeServer(server: ServerSnapshot): void;
  /** Clears `dirty` only on rows unchanged since they were sent (updatedAt matches). */
  markSynced(sent: SyncedRows): void;
  reset(): void;
}

export interface SyncedRows {
  drills: { id: string; updatedAt: string }[];
  journal: { id: string; updatedAt: string }[];
}

/** Rows as stored on the server, already mapped to local shape (clean). */
export interface ServerSnapshot {
  drills: Omit<DrillDayRow, 'dirty'>[];
  journal: Omit<JournalRow, 'dirty' | 'deleted'>[];
  practice?: Practice | null;
}

export type DrillStore = DrillData & DrillActions;

export const initialDrillData: DrillData = {
  startedOn: null,
  notifyAt: '07:00',
  notificationsAsked: false,
  reportSkipped: {},
  askSkipped: {},
  drills: {},
  journal: {},
  practice: null,
  practiceDirty: false,
  plan: null,
  lookBack: null,
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
            [id]: {
              ...row,
              status,
              tier,
              effort: null,
              dodgeReason: null,
              respondedAt: stamp(),
              updatedAt: stamp(),
              dirty: true,
            },
          },
        };
      });
    },

    undo(id) {
      set((s) => {
        const row = s.drills[id];
        if (!row) return {};
        const spineTier = kindOf(row) === 'spine' && row.day <= 45 ? spineDay(row.day).tier : row.tier;
        // The report-back answered "what did it cost / what did you learn" for
        // the old answer, so it goes too.
        const journal = { ...s.journal };
        for (const j of Object.values(journal)) {
          if (j.drillDayId === id && !j.deleted) journal[j.id] = { ...j, deleted: true, dirty: true, updatedAt: stamp() };
        }
        return {
          drills: {
            ...s.drills,
            [id]: {
              ...row,
              status: 'pending',
              tier: spineTier,
              effort: null,
              dodgeReason: null,
              respondedAt: null,
              updatedAt: stamp(),
              dirty: true,
            },
          },
          journal,
        };
      });
    },

    rate(id, effort) {
      set((s) => {
        const row = s.drills[id];
        if (!row || row.status !== 'done') return {};
        return { drills: { ...s.drills, [id]: { ...row, effort, updatedAt: stamp(), dirty: true } } };
      });
    },

    setDodgeReason(id, reason) {
      set((s) => {
        const row = s.drills[id];
        if (!row || row.status !== 'dodged') return {};
        return { drills: { ...s.drills, [id]: { ...row, dodgeReason: reason, updatedAt: stamp(), dirty: true } } };
      });
    },

    setPlan(plan) {
      set(() => ({ plan }));
    },

    setLookBack(v) {
      set(() => ({ lookBack: v }));
    },

    skipAsk(id) {
      set((s) => ({ askSkipped: { ...s.askSkipped, [id]: true } }));
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

    deleteReport(journalId) {
      set((s) => {
        const j = s.journal[journalId];
        if (!j) return {};
        return { journal: { ...s.journal, [journalId]: { ...j, deleted: true, dirty: true, updatedAt: stamp() } } };
      });
    },

    setPractice(p) {
      set(() => ({ practice: p, practiceDirty: true }));
    },

    ensurePracticeToday(today) {
      const data = get();
      const plan = practiceToday(data, today);
      if (!plan) return [];
      const ids: string[] = [];
      const add: Record<string, DrillDayRow> = {};
      for (const slot of plan.slots) {
        if (slot.row) {
          // A pending restart drill carried over from an earlier day moves to today.
          if (slot.row.status === 'pending' && slot.row.scheduledFor !== today) {
            add[slot.row.id] = { ...slot.row, scheduledFor: today, day: plan.day, updatedAt: stamp(), dirty: true };
          }
          ids.push(slot.row.id);
          continue;
        }
        const row: DrillDayRow = {
          id: deps.newId(),
          kind: slot.kind,
          day: plan.day,
          ruleId: slot.ruleId,
          tier: slot.tier,
          scheduledFor: today,
          status: 'pending',
          respondedAt: null,
          updatedAt: stamp(),
          dirty: true,
        };
        add[row.id] = row;
        ids.push(row.id);
      }
      if (Object.keys(add).length) set((s) => ({ drills: { ...s.drills, ...add } }));
      return ids;
    },

    markPracticeSynced(sent) {
      set((s) => (s.practice === sent ? { practiceDirty: false } : {}));
    },

    mergeServer(server) {
      set((s) => mergeServerRows(s, server));
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
      partialize: ({
        startedOn,
        notifyAt,
        notificationsAsked,
        reportSkipped,
        drills,
        journal,
        practice,
        practiceDirty,
        plan,
        lookBack,
        askSkipped,
      }) => ({
        askSkipped,
        plan,
        lookBack,
        practice,
        practiceDirty,
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

/**
 * Merge rule for signing in (decisions log, step 5):
 * - The server's history wins for every day it has. A local row for the same
 *   spine day under a different id is dropped, with its report-back.
 * - A row with the same id: local wins only if it has unsent changes.
 * - Local days the server doesn't have are kept, and sync pushes them.
 * - Local tombstones are kept so their server delete still goes out.
 */
export function mergeServerRows(local: DrillData, server: ServerSnapshot): Partial<DrillData> {
  const drills: Record<string, DrillDayRow> = {};
  const serverDays = new Set(server.drills.map((d) => `${d.day}:${d.ruleId}`));
  const dropped = new Set<string>();

  for (const d of Object.values(local.drills)) {
    const sameId = server.drills.find((x) => x.id === d.id);
    if (!sameId && serverDays.has(`${d.day}:${d.ruleId}`)) {
      dropped.add(d.id);
      continue;
    }
    drills[d.id] = d;
  }
  for (const d of server.drills) {
    const mine = drills[d.id];
    if (mine?.dirty) continue;
    drills[d.id] = { ...d, dirty: false };
  }

  const journal: Record<string, JournalRow> = {};
  for (const j of Object.values(local.journal)) {
    if (dropped.has(j.drillDayId)) continue;
    journal[j.id] = j;
  }
  for (const j of server.journal) {
    const mine = journal[j.id];
    if (mine?.dirty) continue;
    // One live report per drill: a clean local entry on the same drill under another id gives way.
    for (const other of Object.values(journal)) {
      if (other.drillDayId === j.drillDayId && other.id !== j.id && !other.deleted && !other.dirty) delete journal[other.id];
    }
    journal[j.id] = { ...j, dirty: false, deleted: false };
  }

  const dates = Object.values(drills).map((d) => d.scheduledFor).sort();
  const startedOn = local.startedOn && dates[0] ? (local.startedOn < dates[0] ? local.startedOn : dates[0]) : (local.startedOn ?? dates[0] ?? null);
  const practice = local.practiceDirty ? local.practice : (server.practice ?? local.practice);
  return { drills, journal, startedOn, practice };
}

/** Rows with changes not yet on the server. */
export function pendingCount(data: DrillData): number {
  return (
    Object.values(data.drills).filter((d) => d.dirty).length +
    Object.values(data.journal).filter((j) => j.dirty).length +
    (data.practiceDirty ? 1 : 0)
  );
}
