// status: approved — Mark, 2026-11-06
//
// Tab labels are the screen names from the build brief (CLAUDE.md §3).
// `building` is a developer placeholder shown on screens that are not built
// yet; it never ships to readers.

export const navigationCopy = {
  status: 'approved',
  tabs: {
    today: 'Today',
    rules: 'Rules',
    progress: 'Progress',
    journal: 'Journal',
    settings: 'Settings',
  },
  building: (step: number) => `Not built yet. Build step ${step}.`,
} as const;
