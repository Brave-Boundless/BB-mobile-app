import { beforeEach, describe, expect, it } from '@jest/globals';

import { checkReport } from '../journal-rules';
import { drillActions, initialDrillData, reportFor, type DrillActions, type DrillData } from '../store';

const D1 = '2026-11-10';
const D2 = '2026-11-11';

function makeStore() {
  let state: DrillData = structuredClone(initialDrillData);
  let clock = Date.parse('2026-11-10T12:00:00Z');
  let n = 0;
  const actions: DrillActions = drillActions(
    (fn) => {
      state = { ...state, ...fn(state) };
    },
    () => state,
    { now: () => new Date((clock += 1000)), newId: () => `id-${++n}` },
  );
  return { actions, get: () => state };
}

describe('drill store', () => {
  let s: ReturnType<typeof makeStore>;
  beforeEach(() => {
    s = makeStore();
    s.actions.start(D1, '06:30');
  });

  it('creates day 1 once, idempotently', () => {
    const a = s.actions.openToday(D1);
    const b = s.actions.openToday(D1);
    expect(a).toBe(b);
    expect(Object.values(s.get().drills)).toHaveLength(1);
    expect(s.get().drills[a!]).toMatchObject({ day: 1, ruleId: 1, tier: 'five_minute', status: 'pending', dirty: true });
    expect(s.get().notifyAt).toBe('06:30');
  });

  it('answers, then unlocks day 2 tomorrow', () => {
    const id = s.actions.openToday(D1)!;
    s.actions.answer(id, 'dodged', 'five_minute');
    expect(s.actions.openToday(D1)).toBe(id); // still today's
    const next = s.actions.openToday(D2)!;
    expect(s.get().drills[next]).toMatchObject({ day: 2, tier: 'uncomfortable', scheduledFor: D2 });
  });

  it('carries an unanswered drill over to today', () => {
    const id = s.actions.openToday(D1)!;
    expect(s.actions.openToday(D2)).toBe(id);
    expect(s.get().drills[id].scheduledFor).toBe(D2);
  });

  it('records the five-minute fallback tier, and undo restores the scheduled tier', () => {
    s.actions.answer(s.actions.openToday(D1)!, 'done', 'five_minute');
    const id = s.actions.openToday(D2)!; // day 2: uncomfortable
    s.actions.answer(id, 'done', 'five_minute');
    expect(s.get().drills[id]).toMatchObject({ status: 'done', tier: 'five_minute' });
    s.actions.saveReport(id, 'Cost me nothing.');
    s.actions.undo(id);
    expect(s.get().drills[id]).toMatchObject({ status: 'pending', tier: 'uncomfortable', respondedAt: null });
    expect(reportFor(s.get(), id)).toBeUndefined();
  });

  it('saves one report per drill and edits it in place', () => {
    const id = s.actions.openToday(D1)!;
    s.actions.answer(id, 'done', 'five_minute');
    s.actions.saveReport(id, 'First.');
    s.actions.saveReport(id, 'Second.');
    const live = Object.values(s.get().journal).filter((j) => !j.deleted);
    expect(live).toHaveLength(1);
    expect(live[0].body).toBe('Second.');
  });

  it('only clears dirty on rows unchanged since they were sent', () => {
    const id = s.actions.openToday(D1)!;
    const sent = { drills: [{ id, updatedAt: s.get().drills[id].updatedAt }], journal: [] };
    s.actions.answer(id, 'done', 'five_minute'); // edit lands mid-sync
    s.actions.markSynced(sent);
    expect(s.get().drills[id].dirty).toBe(true);
    s.actions.markSynced({ drills: [{ id, updatedAt: s.get().drills[id].updatedAt }], journal: [] });
    expect(s.get().drills[id].dirty).toBe(false);
  });

  it('leaves the store untouched when a sync had nothing to clean (no endless sync loop)', () => {
    const id = s.actions.openToday(D1)!;
    s.actions.markSynced({ drills: [{ id, updatedAt: s.get().drills[id].updatedAt }], journal: [] });
    const { drills, journal } = s.get();
    s.actions.markSynced({ drills: [{ id, updatedAt: drills[id].updatedAt }], journal: [] });
    s.actions.markSynced({ drills: [], journal: [] });
    expect(s.get().drills).toBe(drills);
    expect(s.get().journal).toBe(journal);
  });

  it('drops journal tombstones once the server delete is confirmed', () => {
    const id = s.actions.openToday(D1)!;
    s.actions.answer(id, 'done', 'five_minute');
    s.actions.saveReport(id, 'Gone soon.');
    s.actions.undo(id);
    const tomb = Object.values(s.get().journal)[0];
    expect(tomb.deleted).toBe(true);
    s.actions.markSynced({ drills: [], journal: [{ id: tomb.id, updatedAt: tomb.updatedAt }] });
    expect(s.get().journal).toEqual({});
  });
});

describe('checkReport', () => {
  it('accepts 1-3 sentences, rejects more and empty', () => {
    expect(checkReport('  It cost me sleep.  ')).toEqual({ ok: true, body: 'It cost me sleep.' });
    expect(checkReport('One. Two. Three.').ok).toBe(true);
    expect(checkReport('One. Two. Three. Four.')).toEqual({ ok: false, reason: 'too_long' });
    expect(checkReport('   ')).toEqual({ ok: false, reason: 'empty' });
    expect(checkReport('x'.repeat(1001))).toEqual({ ok: false, reason: 'too_long' });
  });
});
