// status: draft — awaiting Mark's approval
//
// Copy for build step 4: the Progress tab. Book text (rule titles, scorecard
// lines, mantras, part names) comes from content/ verbatim. Did it / Dodged it
// and tier names reuse the approved copy in copy/today.ts.

export const progressCopy = {
  status: 'draft',

  title: 'Progress',

  // ── Where you are ────────────────────────────────────────────────────────
  day: {
    label: 'Day',
    value: (day: number, total: number) => `${day} of ${total}`,
    notStarted: 'Not started. Day 1 is on Today.',
    complete: (total: number) => `${total} of ${total}. Done.`,
  },

  // ── Streak (definition: see CLAUDE.md decisions log) ─────────────────────
  streak: {
    label: 'Streak',
    value: (n: number) => (n === 1 ? '1 drill' : `${n} drills`),
    zero: 'Zero. The next Did it starts one.',
    // Under a live streak: the mantra of the rule you last did, from the book.
  },

  // ── Rule map: 15 cells, one per rule ─────────────────────────────────────
  map: {
    title: 'Rule map',
    legend: {
      all: 'All done',
      most: 'Mostly done',
      some: 'Mostly dodged',
      none: 'Not reached',
    },
    // Screen reader label per cell, e.g. "Rule 3. 2 of 3 done."
    cellA11y: (rule: number, done: number, answered: number) =>
      answered === 0 ? `Rule ${rule}. Not reached.` : `Rule ${rule}. ${done} of ${answered} done.`,
  },

  // ── Scorecards: each rule's scorecard line from the book + your count ────
  scorecards: {
    title: 'Scorecards',
    hint: 'The book’s scorecard for each rule. Keep score where it happens. Here’s your count.',
    tally: (done: number, answered: number) => `${done} of ${answered} done`,
    notReached: 'Not reached',
  },
} as const;
