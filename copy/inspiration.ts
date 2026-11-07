// status: draft — 2026-11-07
//
// Book passages from content/passages.json, shown verbatim. Morning passage on
// Today (matched to the current rule), evening passage after the report-back,
// and the Passages library in the Rules tab. Passages marked `explicit` stay
// out of push notifications but can show in the app.

export const inspirationCopy = {
  status: 'draft',
  morning: 'This morning',
  evening: 'Before you close the day',
  // Under every passage, e.g. "Rule 1 · Burn the Map"
  source: (rule: number, chapter: string) => `Rule ${rule} · ${chapter}`,
  save: 'Save',
  saved: 'Saved',
  share: 'Share',
  library: {
    title: 'Passages',
    intro: 'Lines from the book, sorted by what you’re facing.',
    all: 'All',
    savedFilter: 'Saved',
    byRule: 'By rule',
    empty: 'Nothing saved yet. Tap Save on any passage.',
    situations: {
      fear: 'Fear',
      stalling: 'Stalling',
      momentum: 'Momentum',
      conflict: 'Conflict',
      relationships: 'Relationships',
      work: 'Work',
      setback: 'Setbacks',
      identity: 'Identity',
      health: 'Health',
      standards: 'Standards',
      parenting: 'Parenting',
      numbing: 'Numbing out',
      legacy: 'Legacy',
      faith: 'Faith',
      money: 'Money',
    },
  },
} as const;
