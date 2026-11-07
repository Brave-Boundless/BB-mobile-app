import { beforeEach, describe, expect, it } from '@jest/globals';

import { drillActions, initialDrillData, type DrillActions, type DrillData } from '../store';

const D1 = '2026-11-10';

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

describe('step 7: rating, dodge reason, plan', () => {
  let s: ReturnType<typeof makeStore>;
  let id: string;
  beforeEach(() => {
    s = makeStore();
    s.actions.start(D1, '06:30');
    id = s.actions.openToday(D1)!;
  });

  it('rates a done drill and marks it for sync', () => {
    s.actions.answer(id, 'done', 'five_minute');
    s.actions.markSynced({ drills: [{ id, updatedAt: s.get().drills[id].updatedAt }], journal: [] });
    s.actions.rate(id, 4);
    expect(s.get().drills[id]).toMatchObject({ effort: 4, dirty: true });
  });

  it('only rates done drills and only records reasons on dodged drills', () => {
    s.actions.rate(id, 3); // pending
    expect(s.get().drills[id].effort).toBeUndefined();
    s.actions.answer(id, 'dodged', 'five_minute');
    s.actions.rate(id, 3);
    expect(s.get().drills[id].effort).toBeNull();
    s.actions.setDodgeReason(id, 'fear');
    expect(s.get().drills[id].dodgeReason).toBe('fear');
  });

  it('clears the rating and reason when the answer changes or is undone', () => {
    s.actions.answer(id, 'dodged', 'five_minute');
    s.actions.setDodgeReason(id, 'time');
    s.actions.undo(id);
    expect(s.get().drills[id]).toMatchObject({ status: 'pending', effort: null, dodgeReason: null });
    s.actions.answer(id, 'done', 'five_minute');
    s.actions.rate(id, 5);
    s.actions.answer(id, 'dodged', 'five_minute');
    expect(s.get().drills[id]).toMatchObject({ effort: null, dodgeReason: null });
  });

  it('keeps tomorrow’s plan and clears it', () => {
    s.actions.setPlan({ forDate: '2026-11-11', at: '12:30' });
    expect(s.get().plan).toEqual({ forDate: '2026-11-11', at: '12:30' });
    s.actions.setPlan(null);
    expect(s.get().plan).toBeNull();
  });

  it('resets everything on reset', () => {
    s.actions.setPlan({ forDate: '2026-11-11', at: '12:30' });
    s.actions.setLookBack({ on: D1, journalId: 'j' });
    s.actions.reset();
    expect(s.get().plan).toBeNull();
    expect(s.get().lookBack).toBeNull();
  });
});
