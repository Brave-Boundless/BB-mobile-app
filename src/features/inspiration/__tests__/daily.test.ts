import { describe, expect, it } from '@jest/globals';

import { passages, rules } from '@/content';
import type { DrillDayRow } from '@/features/drill/store';

import { REASON_SITUATION, eveningPassage, lastDodgeReason, morningPassage } from '../daily';

const row = (day: number, date: string, over: Partial<DrillDayRow> = {}): DrillDayRow => ({
  id: `d${day}`,
  day,
  ruleId: Math.ceil(day / 3) as DrillDayRow['ruleId'],
  tier: 'five_minute',
  scheduledFor: date,
  status: 'done',
  respondedAt: `${date}T12:00:00Z`,
  updatedAt: 'u',
  dirty: false,
  ...over,
});
const data = (...rows: DrillDayRow[]) => ({ drills: Object.fromEntries(rows.map((r) => [r.id, r])) });

describe('daily passage', () => {
  it('gives every rule a morning passage on each of its three days, all different', () => {
    for (const r of rules) {
      const ids = [1, 2, 3].map((i) => morningPassage(data(), '2026-11-10', r.number, (r.number - 1) * 3 + i)!.passage);
      for (const p of ids) expect(p).toMatchObject({ rule: r.number, use: 'morning' });
      expect(new Set(ids.map((p) => p.id)).size).toBe(3);
    }
  });

  it('gives every rule an evening passage', () => {
    for (const r of rules) expect(eveningPassage(r.number, (r.number - 1) * 3 + 1)).toMatchObject({ rule: r.number, use: 'evening' });
  });

  it('after a dodge with a reason, picks a passage tagged for that reason', () => {
    const d = data(row(1, '2026-11-09', { status: 'dodged', dodgeReason: 'fear' }), row(2, '2026-11-10', { status: 'pending', respondedAt: null }));
    const pick = morningPassage(d, '2026-11-10', 1, 2)!;
    expect(pick.because).toBe('fear');
    expect(pick.passage.situations).toContain('fear');
    expect(pick.passage.use).not.toBe('exercise');
  });

  it('goes back to the rule once the last answer was not a dodge, or the reason has no tag', () => {
    const done = data(row(1, '2026-11-08', { status: 'dodged', dodgeReason: 'fear' }), row(2, '2026-11-09'));
    expect(morningPassage(done, '2026-11-10', 1, 3)!.because).toBeUndefined();
    const other = data(row(1, '2026-11-09', { status: 'dodged', dodgeReason: 'other' }));
    expect(morningPassage(other, '2026-11-10', 1, 2)).toMatchObject({ passage: { rule: 1, use: 'morning' } });
  });

  it('ignores today’s own dodge until tomorrow', () => {
    expect(lastDodgeReason(data(row(1, '2026-11-10', { status: 'dodged', dodgeReason: 'fear' })), '2026-11-10')).toBeUndefined();
  });

  it('has passages for every mapped reason', () => {
    for (const tag of Object.values(REASON_SITUATION)) {
      expect(passages.filter((p) => p.use !== 'exercise' && p.situations.includes(tag!)).length).toBeGreaterThan(2);
    }
  });
});
