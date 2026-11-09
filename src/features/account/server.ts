// Server reads and account calls. Pure functions over a Supabase client so
// they can be tested with a fake client.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DrillTier, RuleId } from "@/content";
import type { DrillStatus } from "@/features/drill/progress";
import type {
  DodgeReason,
  DrillKind,
  Effort,
  Practice,
  ServerSnapshot,
} from "@/features/drill/store";

interface DrillDayDb {
  id: string;
  kind: DrillKind;
  day_number: number;
  rule_id: number;
  tier: DrillTier;
  scheduled_for: string;
  status: DrillStatus;
  responded_at: string | null;
  effort: number | null;
  dodge_reason: DodgeReason | null;
  updated_at: string;
}

interface JournalDb {
  id: string;
  drill_day_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

/** Everything this user has on the server, mapped to local row shape. RLS limits it to their own rows. */
export async function pullServer(
  client: SupabaseClient,
): Promise<ServerSnapshot> {
  const [drills, journal, me] = await Promise.all([
    client
      .from("drill_days")
      .select(
        "id, kind, day_number, rule_id, tier, scheduled_for, status, responded_at, effort, dodge_reason, updated_at",
      ),
    client
      .from("journal_entries")
      .select("id, drill_day_id, body, created_at, updated_at"),
    client
      .from("users")
      .select("daily_set, restart_rules, practice_started_on")
      .maybeSingle(),
  ]);
  if (drills.error) throw drills.error;
  if (journal.error) throw journal.error;
  if (me.error) throw me.error;
  const u = me.data as {
    daily_set: number[];
    restart_rules: number[];
    practice_started_on: string | null;
  } | null;
  return {
    practice: u?.practice_started_on
      ? {
          dailySet: u.daily_set as RuleId[],
          restartRules: u.restart_rules as RuleId[],
          startedOn: u.practice_started_on,
        }
      : null,
    drills: (drills.data as DrillDayDb[]).map((d) => ({
      id: d.id,
      kind: d.kind,
      day: d.day_number,
      ruleId: d.rule_id as RuleId,
      tier: d.tier,
      scheduledFor: d.scheduled_for,
      status: d.status,
      respondedAt: d.responded_at,
      effort: (d.effort ?? null) as Effort | null,
      dodgeReason: d.dodge_reason ?? null,
      updatedAt: d.updated_at,
    })),
    journal: (journal.data as JournalDb[]).map((j) => ({
      id: j.id,
      drillDayId: j.drill_day_id,
      body: j.body,
      createdAt: j.created_at,
      updatedAt: j.updated_at,
    })),
  };
}

/** Saves the push time and time zone on the user's row (used by phase-2 features and other devices). */
export async function pushSettings(
  client: SupabaseClient,
  userId: string,
  notifyAt: string,
  tz: string,
): Promise<void> {
  const { error } = await client
    .from("users")
    .update({ notify_at: notifyAt, tz })
    .eq("id", userId);
  if (error) throw error;
}

/** Saves the Day-45 wrap-up choices on the user's row. */
export async function pushPractice(
  client: SupabaseClient,
  userId: string,
  p: Practice,
): Promise<void> {
  const { error } = await client
    .from("users")
    .update({
      daily_set: p.dailySet,
      restart_rules: p.restartRules,
      practice_started_on: p.startedOn,
    })
    .eq("id", userId);
  if (error) throw error;
}

/** Deletes the signed-in user's account and all their rows (Edge Function `delete-account`). */
export async function deleteAccountOnServer(
  client: SupabaseClient,
): Promise<void> {
  const { error } = await client.functions.invoke("delete-account", {
    method: "POST",
  });
  if (error) throw error;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
