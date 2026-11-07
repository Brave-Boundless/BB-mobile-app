import drillOutcomesJson from '@content/drill-outcomes.json';
import passagesJson from '@content/passages.json';
import ruleCardsJson from '@content/bb-rule-cards.json';

import type { DrillTier, Part, PartId, Passage, PassagesFile, RuleCard, RuleCardsFile, RuleId } from './types';

export * from './types';

// JSON imports are widened by TypeScript (e.g. `part: number`). The shape is
// enforced at test time by src/content/__tests__/content.test.ts, so the cast
// here is safe as long as that suite passes.
const ruleCards = ruleCardsJson as unknown as RuleCardsFile;
const passagesFile = passagesJson as unknown as PassagesFile;

export const parts: readonly Part[] = ruleCards.parts;
export const rules: readonly RuleCard[] = ruleCards.rules;
export const passages: readonly Passage[] = passagesFile.passages;

export function getRule(id: RuleId): RuleCard {
  const rule = rules.find((r) => r.number === id);
  if (!rule) throw new Error(`Unknown rule ${id}`);
  return rule;
}

export function getPart(id: PartId): Part {
  const part = parts.find((p) => p.id === id);
  if (!part) throw new Error(`Unknown part ${id}`);
  return part;
}

// ── Go deeper (build step 7) ────────────────────────────────────────────────

interface DrillOutcomesFile {
  rules: ({ number: RuleId } & Record<DrillTier, string>)[];
}
const drillOutcomes = drillOutcomesJson as unknown as DrillOutcomesFile;

/** "What it builds" for one drill. New writing approved by Mark, not book text. */
export function drillOutcome(rule: RuleId, tier: DrillTier): string {
  const entry = drillOutcomes.rules.find((r) => r.number === rule);
  if (!entry) throw new Error(`No outcome for rule ${rule}`);
  return entry[tier];
}

/**
 * Passages for a drill's Go deeper page: up to three of the rule's
 * reading passages (not exercises). Each tier gets its own three, so the
 * three drills of a rule show different lines.
 */
export function deeperPassages(rule: RuleId, tier: DrillTier, count = 3): Passage[] {
  const pool = passages.filter((p) => p.rule === rule && p.use !== 'exercise');
  if (pool.length === 0) return [];
  const start = ['five_minute', 'uncomfortable', 'daily'].indexOf(tier) * count;
  const out: Passage[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i += 1) out.push(pool[(start + i) % pool.length]);
  return out;
}

/** The chapter exercise shown under "Go further" for a drill, if the rule has any. */
export function deeperExercise(rule: RuleId, tier: DrillTier): Passage | undefined {
  const pool = passages.filter((p) => p.rule === rule && p.use === 'exercise');
  if (pool.length === 0) return undefined;
  return pool[['five_minute', 'uncomfortable', 'daily'].indexOf(tier) % pool.length];
}

/** Splits an exercise into its name and body ("Name Your Cleveland: Get specific…"). */
export function splitExercise(text: string): { name?: string; body: string } {
  const i = text.indexOf(':');
  if (i > 0 && i <= 48) return { name: text.slice(0, i).trim(), body: text.slice(i + 1).trim() };
  return { body: text };
}
