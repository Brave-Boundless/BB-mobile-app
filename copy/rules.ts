// status: approved — Mark, 2026-11-06
//
// Copy for build step 3: the Rules tab (15 cards in four parts) and a single
// rule's detail screen. Book text is NOT here: part names and subtitles, rule
// titles, chapters, why_it_matters, the three drills, scorecard and mantra
// are all read from content/ verbatim. Tier names and Did it / Dodged it reuse
// the approved copy in copy/today.ts.

export const rulesCopy = {
  status: 'approved',

  // ── List ───────────────────────────────────────────────────────────────
  list: {
    title: 'Rules',
    // e.g. "Part I" — followed by the part name (FIRE) and subtitle from the book
    partLabel: (roman: string) => `Part ${roman}`,
    ruleLabel: (n: number) => `Rule ${n}`,
    // Status line under each card title
    current: 'Today',
    notStarted: (startDay: number) => `Starts Day ${startDay}`,
    tally: (done: number, dodged: number) => `${done} done · ${dodged} dodged`,
  },

  // ── Detail (all six card fields, then the user's history) ──────────────
  detail: {
    ruleLabel: (n: number) => `Rule ${n}`,
    chapter: (title: string) => `Chapter: ${title}`,
    whyItMatters: 'Why it matters',
    drills: 'The drills',
    scorecard: 'Scorecard',
    mantra: 'Mantra',
    history: 'Your record',
    historyEmpty: (startDay: number) => `Nothing yet. This rule starts on Day ${startDay}.`,
    // One row per drill day, e.g. "Day 5 · Uncomfortable drill · Did it"
    historyDay: (day: number) => `Day ${day}`,
    fallbackNote: 'took the five-minute drill',
    pending: 'Up today',
    // Shown under a history row that has a report-back
    reportLabel: 'You wrote',
  },
} as const;
