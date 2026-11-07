// status: approved — Mark, 2026-11-07
//
// Five tabs (Mark, 2026-11-07): Today · Rules · Ask Mark · Community · Journal.
// Progress moves inside Rules. Settings moved off the tab bar into the
// account icon at the top right of every tab (Mark, 2026-11-07).
// Earlier labels (Today, Rules, Progress, Journal, Settings) live on as tab
// and segment names.
// `building` is a developer placeholder shown on screens that are not built
// yet; it never ships to readers.

export const navigationCopy = {
  status: 'approved',
  // Five tabs (approved 2026-11-07).
  tabs: {
    today: 'Today',
    askMark: 'Ask Mark',
    rules: 'Rules',
    community: 'Community',
    journal: 'Journal',
  },
  // Segments at the top of the Rules tab
  rulesTabs: {
    rules: 'Rules',
    progress: 'Progress',
    passages: 'Passages',
  },
  // Account icon, top right of every tab: the reader's initials once signed
  // in, a plain outline before. Opens Settings (title from copy/settings.ts).
  account: {
    a11y: 'Account and settings',
  },
  building: (step: number) => `Not built yet. Build step ${step}.`,
} as const;
