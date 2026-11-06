import { describe, expect, it } from '@jest/globals';

import { addDays } from '../local-date';
import { planMorningNotifications } from '../notification-plan';
import { dayShownOn, todayState, type DrillRecord } from '../progress';

const D = '2026-11-10';

describe('todayState', () => {
  it('starts at day 1 with no records', () => {
    expect(todayState([], D)).toEqual({ kind: 'drill', day: 1, isNew: true });
  });

  it('keeps showing an unanswered drill, even days later (no skipping, no penalty)', () => {
    const records: DrillRecord[] = [{ day: 4, scheduledFor: addDays(D, -3), status: 'pending' }];
    expect(todayState(records, D)).toEqual({ kind: 'drill', day: 4, isNew: false });
  });

  it('shows the answered state for the rest of the day', () => {
    const records: DrillRecord[] = [{ day: 4, scheduledFor: D, status: 'dodged' }];
    expect(todayState(records, D)).toEqual({ kind: 'answered', day: 4, status: 'dodged' });
  });

  it('unlocks the next day on the next calendar day, dodged or done', () => {
    for (const status of ['done', 'dodged'] as const) {
      const records: DrillRecord[] = [{ day: 4, scheduledFor: addDays(D, -1), status }];
      expect(todayState(records, D)).toEqual({ kind: 'drill', day: 5, isNew: true });
    }
  });

  it('after a gap of days, resumes at the next day', () => {
    const records: DrillRecord[] = [{ day: 4, scheduledFor: addDays(D, -9), status: 'done' }];
    expect(todayState(records, D)).toEqual({ kind: 'drill', day: 5, isNew: true });
  });

  it('is complete the day after day 45 is answered', () => {
    const records: DrillRecord[] = [{ day: 45, scheduledFor: addDays(D, -1), status: 'done' }];
    expect(todayState(records, D)).toEqual({ kind: 'complete' });
    expect(todayState([{ day: 45, scheduledFor: D, status: 'done' }], D)).toMatchObject({ kind: 'answered' });
  });

  it('ignores post-45 recurring drills when placing the spine', () => {
    const records: DrillRecord[] = [
      { day: 45, scheduledFor: addDays(D, -5), status: 'done' },
      { day: 46, scheduledFor: addDays(D, -1), status: 'pending' },
    ];
    expect(todayState(records, D)).toEqual({ kind: 'complete' });
  });
});

describe('dayShownOn', () => {
  it('projects the next day after today when today is answered', () => {
    const records: DrillRecord[] = [{ day: 4, scheduledFor: D, status: 'done' }];
    expect(dayShownOn(records, D, D)).toBe(4);
    expect(dayShownOn(records, D, addDays(D, 1))).toBe(5);
    expect(dayShownOn(records, D, addDays(D, 3))).toBe(5);
  });
});

describe('planMorningNotifications', () => {
  const morning = (date: string, hhmm: string) => {
    const [y, m, d] = date.split('-').map(Number);
    const [h, mi] = hhmm.split(':').map(Number);
    return new Date(y, m - 1, d, h, mi);
  };

  it('schedules 7 mornings with the rule title and mantra', () => {
    const plan = planMorningNotifications([], morning(D, '06:00'), D, '07:00');
    expect(plan).toHaveLength(7);
    expect(plan[0]).toMatchObject({ date: D, day: 1, title: 'Move Before You’re Ready', body: 'Action beats anxiety.' });
    expect(plan[0].fireAt.getHours()).toBe(7);
  });

  it('skips today once the push time has passed', () => {
    const plan = planMorningNotifications([], morning(D, '09:00'), D, '07:00');
    expect(plan[0].date).toBe(addDays(D, 1));
    expect(plan).toHaveLength(6);
  });

  it('after answering, tomorrow onward carries the next rule', () => {
    const records: DrillRecord[] = [{ day: 3, scheduledFor: D, status: 'done' }];
    const plan = planMorningNotifications(records, morning(D, '06:00'), D, '07:00');
    expect(plan[0]).toMatchObject({ date: addDays(D, 1), day: 4, body: 'Clarity now saves carnage later.' });
  });

  it('stops after day 45', () => {
    const records: DrillRecord[] = [{ day: 45, scheduledFor: D, status: 'done' }];
    expect(planMorningNotifications(records, morning(D, '06:00'), D, '07:00')).toEqual([]);
  });
});

describe('addDays', () => {
  it('crosses month, year and DST boundaries by calendar day', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02'); // US DST ends Nov 1 2026
    expect(addDays('2026-03-08', -1)).toBe('2026-03-07');
  });
});
