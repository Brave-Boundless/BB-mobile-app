// Pushes locally-written drills and report-backs to Supabase.
//
// Runs only when there is a signed-in session (accounts are optional; sign-in
// UI lands with Settings in build step 5). Rows keep their client-generated
// ids, so upserts are idempotent and safe to retry after a dropped connection.
// Phase 1 conflict rule: last write wins (the server's updated_at trigger
// stamps on update).

import type { SupabaseClient } from '@supabase/supabase-js';

import type { DrillData, SyncedRows } from './store';

export async function pushDirty(client: SupabaseClient, userId: string, data: DrillData): Promise<SyncedRows> {
  const drills = Object.values(data.drills).filter((d) => d.dirty);
  const journal = Object.values(data.journal).filter((j) => j.dirty);

  if (drills.length > 0) {
    const { error } = await client.from('drill_days').upsert(
      drills.map((d) => ({
        id: d.id,
        user_id: userId,
        day_number: d.day,
        rule_id: d.ruleId,
        tier: d.tier,
        scheduled_for: d.scheduledFor,
        status: d.status,
        responded_at: d.respondedAt,
      })),
    );
    if (error) throw error;
  }

  const live = journal.filter((j) => !j.deleted);
  if (live.length > 0) {
    const { error } = await client.from('journal_entries').upsert(
      live.map((j) => ({
        id: j.id,
        user_id: userId,
        drill_day_id: j.drillDayId,
        body: j.body,
        created_at: j.createdAt,
      })),
    );
    if (error) throw error;
  }

  const gone = journal.filter((j) => j.deleted).map((j) => j.id);
  if (gone.length > 0) {
    const { error } = await client.from('journal_entries').delete().in('id', gone);
    if (error) throw error;
  }

  const sent = (r: { id: string; updatedAt: string }) => ({ id: r.id, updatedAt: r.updatedAt });
  return { drills: drills.map(sent), journal: journal.map(sent) };
}
