// What the app tells Ask Mark about the reader (Mark, 2026-11-07): where they
// are in the 45 drills and how today's drill went. Never the journal. Off when
// the reader turns "Share my drill progress" off in Settings.

import { getRule, type DrillTier, type RuleId } from '@/content';
import type { LocalDate } from '@/features/drill/local-date';
import { kindOf, type DodgeReason, type DrillData, type DrillDayRow, type Effort } from '@/features/drill/store';

export type AskMarkContext =
  | {
      phase: 'spine';
      day: number;
      rule: RuleId;
      ruleTitle: string;
      tier: DrillTier;
      drill: string;
      status: DrillDayRow['status'];
      dodgeReason?: DodgeReason;
      effort?: Effort;
    }
  | {
      phase: 'practice';
      dailySet: string[];
      rule?: RuleId;
      ruleTitle?: string;
      tier?: DrillTier;
      drill?: string;
      status?: DrillDayRow['status'];
      dodgeReason?: DodgeReason;
      effort?: Effort;
    };

function drillFields(row: DrillDayRow) {
  const rule = getRule(row.ruleId);
  return {
    rule: rule.number,
    ruleTitle: rule.title,
    tier: row.tier,
    drill: rule.drills[row.tier],
    status: row.status,
    ...(row.status === 'dodged' && row.dodgeReason ? { dodgeReason: row.dodgeReason } : {}),
    ...(row.status === 'done' && row.effort ? { effort: row.effort } : {}),
  };
}

/** The context to send, or null before Day 1 or when sharing is off. */
export function askMarkContext(data: Pick<DrillData, 'drills' | 'practice' | 'startedOn'>, today: LocalDate, share: boolean): AskMarkContext | null {
  if (!share || !data.startedOn) return null;
  const rows = Object.values(data.drills);
  const spine = rows.filter((d) => kindOf(d) === 'spine' && d.day <= 45);

  if (data.practice) {
    const todays = rows.filter((d) => kindOf(d) !== 'spine' && d.scheduledFor === today).sort((a, b) => a.ruleId - b.ruleId);
    return {
      phase: 'practice',
      dailySet: data.practice.dailySet.map((id) => getRule(id).title),
      ...(todays[0] ? drillFields(todays[0]) : {}),
    };
  }
  // The open drill, or the latest answered one.
  const current = spine.find((d) => d.status === 'pending') ?? spine.sort((a, b) => b.day - a.day)[0];
  if (!current) return null;
  return { phase: 'spine', day: current.day, ...drillFields(current) };
}

/** Which drill-aware starter leads the list, if any. */
export function drillStarter(ctx: AskMarkContext | null, hasDodgePattern: boolean): 'dodged' | 'pattern' | 'today' | null {
  if (!ctx) return null;
  if (ctx.status === 'dodged') return 'dodged';
  if (hasDodgePattern) return 'pattern';
  if (ctx.drill) return 'today';
  return null;
}
