import { describe, expect, it } from '@jest/globals';

import type { DrillDayRow } from '../store';
import { allPips, answeredCount, rulePips } from '../structure';

const row = (day: number, status: DrillDayRow['status'], kind?: DrillDayRow['kind']): DrillDayRow => ({
  id: `d${day}${kind ?? ''}`,
  kind,
  day,
  ruleId: Math.ceil(day / 3) as DrillDayRow['ruleId'],
  tier: 'five_minute',
  scheduledFor: '2026-11-10',
  status,
  respondedAt: null,
  updatedAt: 't',
  dirty: false,
});
const data = (...rows: DrillDayRow[]) => ({ drills: Object.fromEntries(rows.map((r) => [r.id, r])) });

describe('45-drill structure', () => {
  it('shows a rule’s three drills as done / dodged / today / ahead', () => {
    const d = data(row(4, 'done'), row(5, 'dodged'), row(6, 'pending'));
    expect(rulePips(d, 2)).toEqual(['done', 'dodged', 'current']);
    expect(rulePips(d, 3)).toEqual(['ahead', 'ahead', 'ahead']);
  });

  it('counts answered spine drills only, out of 45', () => {
    const d = data(row(1, 'done'), row(2, 'dodged'), row(3, 'pending'), row(46, 'done', 'daily'));
    expect(answeredCount(d)).toBe(2);
    expect(allPips(d)).toHaveLength(15);
    expect(allPips(d).flat()).toHaveLength(45);
  });
});
