import { describe, expect, it } from '@jest/globals';

import { dodgePattern, lookBackFor, planReminder } from '../after-answer';
import type { DrillDayRow, JournalRow } from '../store';

const drill = (day: number, over: Partial<DrillDayRow> = {}): DrillDayRow => ({
  id: `d${day}`,
  day,
  ruleId: Math.ceil(day / 3) as DrillDayRow['ruleId'],
  tier: 'five_minute',
  scheduledFor: '2026-11-01',
  status: 'done',
  respondedAt: 'r',
  updatedAt: 'u',
  dirty: false,
  ...over,
});
const byId = <T extends { id: string }>(...xs: T[]) => Object.fromEntries(xs.map((x) => [x.id, x]));
const note = (id: string, drillDayId: string, createdAt: string): JournalRow => ({
  id,
  drillDayId,
  body: `note ${id}`,
  createdAt,
  updatedAt: createdAt,
  dirty: false,
  deleted: false,
});

describe('dodge pattern', () => {
  it('needs three reasons and a clear leader', () => {
    const d = (n: number, r: DrillDayRow['dodgeReason']) => drill(n, { status: 'dodged', dodgeReason: r });
    expect(dodgePattern({ drills: byId(d(1, 'fear'), d(2, 'fear')) })).toBeUndefined();
    expect(dodgePattern({ drills: byId(d(1, 'fear'), d(2, 'time'), d(3, 'fear')) })).toEqual({ reason: 'fear', count: 2 });
    expect(dodgePattern({ drills: byId(d(1, 'fear'), d(2, 'time'), d(3, 'fear'), d(4, 'time')) })).toBeUndefined();
  });
});

describe('look back', () => {
  const drills = byId(drill(1), drill(2), drill(9));
  const journal = byId(note('a', 'd1', '2026-11-01T20:00:00Z'), note('b', 'd2', '2026-11-02T20:00:00Z'), note('c', 'd9', '2026-11-09T20:00:00Z'));

  it('only brings back notes at least a week old', () => {
    const r = lookBackFor({ drills, journal, lookBack: null }, '2026-11-09');
    expect(r?.entry.id).toMatch(/^[ab]$/);
    expect(lookBackFor({ drills, journal, lookBack: null }, '2026-11-07')).toBeUndefined();
  });

  it('skips notes from today’s rule', () => {
    expect(lookBackFor({ drills, journal, lookBack: null }, '2026-11-09', 1)).toBeUndefined();
  });

  it('keeps the same note all day', () => {
    expect(lookBackFor({ drills, journal, lookBack: { on: '2026-11-09', journalId: 'b' } }, '2026-11-09')).toMatchObject({
      entry: { id: 'b' },
      day: 2,
      isNew: false,
    });
  });
});

describe('planned reminder', () => {
  const now = new Date(2026, 10, 10, 20, 0);
  const answeredToday = byId(drill(1, { scheduledFor: '2026-11-10' }));

  it('fires at the planned time tomorrow with the next rule’s title', () => {
    const r = planReminder({ drills: answeredToday, plan: { forDate: '2026-11-11', at: '12:30' } }, now, '2026-11-10', 'body');
    expect(r).toEqual({ fireAt: new Date(2026, 10, 11, 12, 30), title: 'Move Before You’re Ready', body: 'body' });
  });

  it('skips past plans and drills already answered that day', () => {
    expect(planReminder({ drills: answeredToday, plan: { forDate: '2026-11-10', at: '12:30' } }, now, '2026-11-10', 'b')).toBeUndefined();
    expect(planReminder({ drills: answeredToday, plan: null }, now, '2026-11-10', 'b')).toBeUndefined();
  });
});
