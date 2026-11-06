import { describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { initialDrillData, type DrillData } from '@/features/drill/store';

import { EXPORT_FORMAT, buildExport, exportFileName } from '../export';
import { EMAIL_RE, deleteAccountOnServer, pullServer } from '../server';

describe('export', () => {
  const data: DrillData = {
    ...initialDrillData,
    startedOn: '2026-10-01',
    notifyAt: '06:30',
    drills: {
      d1: { id: 'd1', day: 1, ruleId: 1, tier: 'five_minute', scheduledFor: '2026-10-01', status: 'done', respondedAt: 'r', updatedAt: 'u', dirty: true },
    },
    journal: {
      j1: { id: 'j1', drillDayId: 'd1', body: 'Kept.', createdAt: '2026-10-01T20:00:00Z', updatedAt: 'u', dirty: false, deleted: false },
      j2: { id: 'j2', drillDayId: 'd1', body: 'Gone.', createdAt: '2026-10-01T21:00:00Z', updatedAt: 'u', dirty: true, deleted: true },
    },
  };

  it('includes settings, every drill and live journal entries', () => {
    const out = buildExport(data, { now: new Date('2026-11-06T12:00:00Z'), appVersion: '1.0.0', email: 'a@b.co' });
    expect(out.format).toBe(EXPORT_FORMAT);
    expect(out.account).toEqual({ email: 'a@b.co' });
    expect(out.settings).toEqual({ startedOn: '2026-10-01', morningPushAt: '06:30' });
    expect(out.afterDay45).toBeNull();
    expect(out.drills).toEqual([
      { id: 'd1', track: 'spine', day: 1, rule: 1, ruleTitle: 'Move Before You’re Ready', tier: 'five_minute', date: '2026-10-01', status: 'done', respondedAt: 'r' },
    ]);
    expect(out.journal).toEqual([{ id: 'j1', drillId: 'd1', day: 1, rule: 1, writtenAt: '2026-10-01T20:00:00Z', body: 'Kept.' }]);
    expect(exportFileName(new Date('2026-11-06T12:00:00Z'))).toBe('brave-and-boundless-2026-11-06.json');
  });

  it('works signed out', () => {
    expect(buildExport(initialDrillData, { now: new Date(), appVersion: '1' }).account).toBeNull();
  });
});

describe('server', () => {
  it('maps server rows to local shape', async () => {
    const tables: Record<string, unknown[]> = {
      drill_days: [{ id: 'd', kind: 'daily', day_number: 4, rule_id: 2, tier: 'five_minute', scheduled_for: '2026-10-04', status: 'dodged', responded_at: 'r', updated_at: 'u' }],
      journal_entries: [{ id: 'j', drill_day_id: 'd', body: 'b', created_at: 'c', updated_at: 'u2' }],
    };
    const users = { daily_set: [3, 8], restart_rules: [5], practice_started_on: '2026-12-15' };
    const client = {
      from: (t: string) => ({
        select: () =>
          t === 'users'
            ? { maybeSingle: async () => ({ data: users, error: null }) }
            : Promise.resolve({ data: tables[t], error: null }),
      }),
    } as unknown as SupabaseClient;
    expect(await pullServer(client)).toEqual({
      practice: { dailySet: [3, 8], restartRules: [5], startedOn: '2026-12-15' },
      drills: [{ id: 'd', kind: 'daily', day: 4, ruleId: 2, tier: 'five_minute', scheduledFor: '2026-10-04', status: 'dodged', respondedAt: 'r', updatedAt: 'u' }],
      journal: [{ id: 'j', drillDayId: 'd', body: 'b', createdAt: 'c', updatedAt: 'u2' }],
    });
  });

  it('calls the delete-account function and surfaces failure', async () => {
    const invoke = jest.fn(async (_name: string, _opts: unknown) => ({ error: null }));
    await deleteAccountOnServer({ functions: { invoke } } as unknown as SupabaseClient);
    expect(invoke).toHaveBeenCalledWith('delete-account', { method: 'POST' });
    const failing = { functions: { invoke: async () => ({ error: new Error('500') }) } } as unknown as SupabaseClient;
    await expect(deleteAccountOnServer(failing)).rejects.toThrow('500');
  });

  it('validates email shape', () => {
    expect(['a@b.co', 'mark@braveandboundless.com'].every((e) => EMAIL_RE.test(e))).toBe(true);
    expect(['a@b', 'a b@c.co', 'nope'].some((e) => EMAIL_RE.test(e))).toBe(false);
  });
});
