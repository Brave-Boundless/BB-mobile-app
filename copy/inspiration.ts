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

  // ── Share a passage (Mark, 2026-11-07) ─────────────────────────────────
  // Builds a 1080 × 1920 image card (passage on black, ember rule line,
  // attribution, site) and opens the phone's share sheet, which covers
  // Instagram (Stories, feed, DM), Messages, WhatsApp, email and the rest.
  share: {
    button: 'Share',
    a11y: 'Share this passage as an image.',
    // On the card, under the passage
    attribution: 'Mark A. Nead · Brave & Boundless',
    site: 'braveandboundless.com',
    // Text sent alongside the image where the app allows it (Messages, email)
    message: (passage: string) => `“${passage}” — Mark A. Nead, Brave & Boundless. braveandboundless.com`,
    failed: 'Couldn’t share. Try again.',
  },
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
