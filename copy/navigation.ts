// status: approved — Mark, 2026-11-07
//
// Five tabs (Mark, 2026-11-07): Today · Rules · Ask Mark · Community · You.
// Progress moves inside Rules; Journal and Settings move inside You.
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
    you: 'You',
  },
  // Segments at the top of the Rules tab
  rulesTabs: {
    rules: 'Rules',
    progress: 'Progress',
    passages: 'Passages',
  },
  // Segments at the top of the You tab
  youTabs: {
    journal: 'Journal',
    settings: 'Settings',
  },
  building: (step: number) => `Not built yet. Build step ${step}.`,
} as const;
