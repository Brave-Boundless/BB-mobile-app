import { describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { initialDrillData, type DrillData } from '../store';
import { pushDirty } from '../sync';

function fakeClient() {
  const calls: { table: string; op: string; payload: unknown }[] = [];
  const client = {
    from: (table: string) => ({
      upsert: jest.fn(async (payload: unknown) => (calls.push({ table, op: 'upsert', payload }), { error: null })),
      delete: () => ({
        in: jest.fn(async (_: string, ids: unknown) => (calls.push({ table, op: 'delete', payload: ids }), { error: null })),
      }),
    }),
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe('pushDirty', () => {
  it('upserts dirty drills before journal entries and deletes tombstones', async () => {
    const data: DrillData = {
      ...initialDrillData,
      drills: {
        a: { id: 'a', day: 1, ruleId: 1, tier: 'five_minute', scheduledFor: '2026-11-10', status: 'done', respondedAt: 't', updatedAt: 'u1', dirty: true },
        b: { id: 'b', day: 2, ruleId: 1, tier: 'uncomfortable', scheduledFor: '2026-11-11', status: 'pending', respondedAt: null, updatedAt: 'u2', dirty: false },
      },
      journal: {
        j1: { id: 'j1', drillDayId: 'a', body: 'Cost.', createdAt: 'c', updatedAt: 'u3', dirty: true, deleted: false },
        j2: { id: 'j2', drillDayId: 'a', body: 'Old.', createdAt: 'c', updatedAt: 'u4', dirty: true, deleted: true },
      },
    };
    const { client, calls } = fakeClient();
    const sent = await pushDirty(client, 'user-1', data);

    expect(calls.map((c) => `${c.op}:${c.table}`)).toEqual(['upsert:drill_days', 'upsert:journal_entries', 'delete:journal_entries']);
    expect(calls[0].payload).toEqual([
      { id: 'a', user_id: 'user-1', kind: 'spine', day_number: 1, rule_id: 1, tier: 'five_minute', scheduled_for: '2026-11-10', status: 'done', responded_at: 't', effort: null, dodge_reason: null },
    ]);
    expect(calls[2].payload).toEqual(['j2']);
    expect(sent).toEqual({ drills: [{ id: 'a', updatedAt: 'u1' }], journal: [{ id: 'j1', updatedAt: 'u3' }, { id: 'j2', updatedAt: 'u4' }] });
  });
});

describe('pushDirty, free notes', () => {
  it('sends a Journal note with no drill as drill_day_id null', async () => {
    const data: DrillData = {
      ...initialDrillData,
      journal: { n1: { id: 'n1', drillDayId: null, body: 'Just a thought.', createdAt: 'c', updatedAt: 'u', dirty: true, deleted: false } },
    };
    const { client, calls } = fakeClient();
    await pushDirty(client, 'user-1', data);
    expect(calls).toEqual([
      { table: 'journal_entries', op: 'upsert', payload: [{ id: 'n1', user_id: 'user-1', drill_day_id: null, body: 'Just a thought.', created_at: 'c' }] },
    ]);
  });
});
