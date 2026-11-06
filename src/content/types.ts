// Types for the book content in /content. The JSON files are the source of
// truth; never rewrite their copy in code.

export type PartId = 1 | 2 | 3 | 4;
export type RuleId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

/** The three drill tiers on every card, in the order the spine uses them. */
export const DRILL_TIERS = ['five_minute', 'uncomfortable', 'daily'] as const;
export type DrillTier = (typeof DRILL_TIERS)[number];

export interface Part {
  id: PartId;
  name: string; // FIRE | FORGE | FOUNDATION | FIELD
  subtitle: string;
  rules: RuleId[];
}

export interface RuleCard {
  number: RuleId;
  title: string;
  chapter: string;
  part: PartId;
  why_it_matters: string;
  drills: Record<DrillTier, string>;
  scorecard: string;
  mantra: string;
}

export interface RuleCardsFile {
  source: string;
  parts: Part[];
  rules: RuleCard[];
}

export const PASSAGE_USES = ['morning', 'evening', 'exercise'] as const;
export type PassageUse = (typeof PASSAGE_USES)[number];

export const SITUATIONS = [
  'fear',
  'stalling',
  'setback',
  'momentum',
  'conflict',
  'relationships',
  'health',
  'money',
  'work',
  'parenting',
  'faith',
  'standards',
  'identity',
  'numbing',
  'legacy',
] as const;
export type Situation = (typeof SITUATIONS)[number];

export interface Passage {
  id: string;
  rule: RuleId;
  use: PassageUse;
  situations: Situation[];
  /** True when the passage contains profanity. Never use these in push notifications. */
  explicit?: boolean;
  text: string;
}

export interface PassagesFile {
  source: string;
  passages: Passage[];
}
