// status: approved — Mark, 2026-11-07
//
// The Go deeper page for a single drill, opened from Today and from each drill
// on a rule's page. Book text is NOT here: why_it_matters, the drill, passages
// and exercises are read from content/ verbatim. "What it builds" is new
// writing in content/drill-outcomes.json (draft, needs Mark's edit).

export const deeperCopy = {
  status: 'approved',
  open: 'Go deeper',
  openA11y: 'Go deeper. Why this drill matters and what it builds.',
  whyItMatters: 'Why it matters',
  whatItBuilds: 'What it builds',
  fromTheBook: 'From the book',
  exercise: 'Go further',
  exerciseHint: 'An exercise from the chapter. Optional. Take your time.',
  askMark: 'Ask Mark about this drill',
  // Pre-filled first message in Ask Mark; the reader can edit before sending.
  askMarkPrompt: (rule: number, ruleTitle: string, tier: string, drill: string) =>
    `I’m on Rule ${rule}, ${ruleTitle}. Today’s ${tier.toLowerCase()}: “${drill}” Where do I start?`,
} as const;
