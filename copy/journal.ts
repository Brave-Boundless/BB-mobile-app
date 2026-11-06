// status: approved — Mark, 2026-11-06
//
// Copy for build step 5a: the Journal tab. Entries are the user's own words;
// rule titles come from content/. The two prompts and Did it / Dodged it
// reuse the approved copy in copy/today.ts.

export const journalCopy = {
  status: 'approved',

  title: 'Journal',

  filter: {
    all: 'All rules',
    rule: (n: number) => `Rule ${n}`,
    a11y: (label: string, selected: boolean) => `Show ${label}${selected ? ', selected' : ''}`,
  },

  // Under the date on each entry, e.g. "Day 4 · Rule 2 · Did it"
  meta: (day: number, rule: number, outcome: string) => `Day ${day} · Rule ${rule} · ${outcome}`,

  empty: 'Nothing here yet. Your evening report-backs land here.',
  emptyFiltered: 'Nothing on this rule yet.',

  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  confirmDelete: {
    title: 'Delete this entry?',
    body: 'It’s gone for good.',
    confirm: 'Delete',
    keep: 'Keep it',
  },
} as const;
