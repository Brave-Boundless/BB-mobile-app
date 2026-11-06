// status: draft — awaiting Mark's approval
//
// Copy for build step 6: the Day-45 wrap-up, the dodge-pattern restart, and
// Today after Day 45 (the "daily set"). Rule titles, drills, mantras and part
// names come from content/ verbatim. Did it / Dodged it, tier names and the two
// evening prompts reuse the approved copy in copy/today.ts.

export const wrapupCopy = {
  status: 'draft',

  // ── Wrap-up (shown on Today the morning after Day 45, until set up) ─────
  wrapup: {
    headline: 'Forty-five days. Done.',
    tally: (done: number, dodged: number) => `You answered all 45. ${done} done, ${dodged} dodged.`,

    dodgeTitle: 'Your dodge pattern',
    dodgeBody: 'The rules you dodged most.',
    dodgeRow: (dodged: number, answered: number) => `Dodged ${dodged} of ${answered}`,
    noDodges: 'No dodges. Not one.',
    restartToggle: 'Run these again',
    restartNote: 'Three days each, same as the first time. Five minutes, uncomfortable, daily.',

    keepTitle: 'Keep running',
    keepBody: 'Pick the rules to keep as daily drills. One tap each, every morning.',
    keepHint: 'Start with two or three.',
    keepA11y: (title: string, on: boolean) => `${title}. ${on ? 'In your daily set' : 'Not in your daily set'}.`,

    cta: 'Lock it in',
    needOne: 'Pick at least one rule, or run the restart.',
  },

  // ── Today after Day 45 ───────────────────────────────────────────────────
  practice: {
    dayLabel: (day: number) => `Day ${day}`,
    restartLabel: (i: number, n: number) => `Restart · rule ${i} of ${n}`,
    dailySet: 'Daily set',
    weeklyChallenge: 'Weekly challenge',
    // Per drill after answering (short; the day has several)
    done: 'Done.',
    dodged: 'Logged.',
    addNote: 'Add a note',
    allAnswered: 'Daily set done. Same time tomorrow.',
    restartDone: 'Restart done. Back to your daily set.',
    change: 'Change daily set',
    empty: 'No daily set yet.',
  },
} as const;
