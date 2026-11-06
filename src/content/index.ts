import passagesJson from '@content/passages.json';
import ruleCardsJson from '@content/bb-rule-cards.json';

import type { Part, PartId, Passage, PassagesFile, RuleCard, RuleCardsFile, RuleId } from './types';

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
