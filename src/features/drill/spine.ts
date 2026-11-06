// The 45-day spine: 15 rules x 3 days, rule 1 -> 15, five_minute ->
// uncomfortable -> daily (CLAUDE.md §3). Pure functions only; no I/O.

import { DRILL_TIERS, getRule, type DrillTier, type PartId, type RuleCard, type RuleId } from '@/content';

export const SPINE_LENGTH = 45;
export const DAYS_PER_RULE = 3;

/** Last day of each part. Milestone screens show on these days. */
export const MILESTONE_DAYS: Readonly<Record<number, PartId>> = { 12: 1, 24: 2, 36: 3, 45: 4 };

export interface SpineDay {
  day: number; // 1-45
  ruleId: RuleId;
  tier: DrillTier;
  /** 1, 2 or 3: which day of this rule. */
  dayOfRule: 1 | 2 | 3;
}

export function spineDay(day: number): SpineDay {
  if (!Number.isInteger(day) || day < 1 || day > SPINE_LENGTH) {
    throw new RangeError(`Spine day must be 1-${SPINE_LENGTH}, got ${day}`);
  }
  const index = (day - 1) % DAYS_PER_RULE;
  return {
    day,
    ruleId: (Math.floor((day - 1) / DAYS_PER_RULE) + 1) as RuleId,
    tier: DRILL_TIERS[index],
    dayOfRule: (index + 1) as 1 | 2 | 3,
  };
}

/** The part that ends on this day, if any. */
export function milestoneFor(day: number): PartId | undefined {
  return MILESTONE_DAYS[day];
}

/** The drill text for a day, straight from the rule card. */
export function drillText(rule: RuleCard, tier: DrillTier): string {
  return rule.drills[tier];
}

export function spineDrill(day: number): SpineDay & { rule: RuleCard; text: string } {
  const entry = spineDay(day);
  const rule = getRule(entry.ruleId);
  return { ...entry, rule, text: drillText(rule, entry.tier) };
}
