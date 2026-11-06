import { describe, expect, it } from '@jest/globals';

import { initialDrillData, mergeServerRows, pendingCount, type DrillData, type DrillDayRow, type ServerSnapshot } from '../store';

const row = (id: string, day: number, over: Partial<DrillDayRow> = {}): DrillDayRow => ({
  id,
  day,
  ruleId: (Math.floor((day - 1) / 3) + 1) as 1,
  tier: 'five_minute',
  scheduledFor: `2026-10-${String(day).padStart(2, '0')}`,
  status: 'done',
  respondedAt: 't',
  updatedAt: 'u',
  dirty: false,
  ...over,
});
const strip = ({ dirty: _d, ...r }: DrillDayRow) => r;

describe('mergeServerRows (sign-in on a phone)', () => {
  it('brings server history onto a fresh phone', () => {
    const server: ServerSnapshot = {
      drills: [strip(row('s1', 1)), strip(row('s2', 2))],
      journal: [{ id: 'j1', drillDayId: 's1', body: 'From the old phone.', createdAt: 'c', updatedAt: 'u' }],
    };
    const out = mergeServerRows(initialDrillData, server);
    expect(Object.keys(out.drills!)).toEqual(['s1', 's2']);
    expect(out.drills!.s1.dirty).toBe(false);
    expect(out.journal!.j1).toMatchObject({ body: 'From the old phone.', dirty: false, deleted: false });
    expect(out.startedOn).toBe('2026-10-01');
  });

  it('server wins for days it has; local-only days are kept and stay dirty', () => {
    const local: DrillData = {
      ...initialDrillData,
      startedOn: '2026-11-01',
      drills: {
        l1: row('l1', 1, { dirty: true, status: 'pending', respondedAt: null }), // same day as server s1
        l5: row('l5', 5, { dirty: true }), // server doesn't have day 5
      },
      journal: { lj: { id: 'lj', drillDayId: 'l1', body: 'x', createdAt: 'c', updatedAt: 'u', dirty: true, deleted: false } },
    };
    const out = mergeServerRows(local, { drills: [strip(row('s1', 1))], journal: [] });
    expect(Object.keys(out.drills!).sort()).toEqual(['l5', 's1']);
    expect(out.drills!.l5.dirty).toBe(true);
    expect(out.journal).toEqual({}); // report on the dropped local day goes with it
    expect(out.startedOn).toBe('2026-10-01'); // earliest
  });

  it('same id: unsent local edits win, clean local copies take the server version', () => {
    const local: DrillData = {
      ...initialDrillData,
      drills: { a: row('a', 1, { status: 'dodged', dirty: true }), b: row('b', 2, { status: 'dodged' }) },
    };
    const out = mergeServerRows(local, { drills: [strip(row('a', 1)), strip(row('b', 2))], journal: [] });
    expect(out.drills!.a.status).toBe('dodged');
    expect(out.drills!.b.status).toBe('done');
  });

  it('counts pending changes', () => {
    expect(
      pendingCount({
        ...initialDrillData,
        drills: { a: row('a', 1, { dirty: true }), b: row('b', 2) },
        journal: { j: { id: 'j', drillDayId: 'a', body: 'x', createdAt: 'c', updatedAt: 'u', dirty: true, deleted: true } },
      }),
    ).toBe(2);
  });
});
