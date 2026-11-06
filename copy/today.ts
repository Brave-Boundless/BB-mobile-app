// status: draft — awaiting Mark's approval
//
// Copy for build step 2: first run, the Today screen, the evening report-back,
// milestones, and the morning push. Book text (rule titles, drills, mantras,
// why_it_matters, part names) is NOT here — it is read from content/ verbatim.
// Everything below is new copy, written to the brief's tone rules: short,
// imperative, no exclamation points, never shame a dodge.

export const todayCopy = {
  status: 'draft',

  // ── First run ────────────────────────────────────────────────────────────
  start: {
    headline: '45 days. 15 rules. One drill a day.',
    body: 'Every morning, one drill from the book. Do it or dodge it. Be honest either way.',
    notifyLabel: 'Morning push at',
    notifyHint: 'The day’s mantra. Nothing else.',
    cta: 'Start Day 1',
  },

  // ── Notification permission (asked once, right after Start) ─────────────
  notifications: {
    ask: 'One push a morning. The rule’s mantra. That’s it.',
    allow: 'Turn on',
    deny: 'Not now',
    deniedNote: 'Pushes are off. Turn them on in Settings when you want them.',
  },

  // ── Today: the drill ─────────────────────────────────────────────────────
  drill: {
    dayOf: (day: number, total: number) => `Day ${day} of ${total}`,
    ruleLabel: (n: number) => `Rule ${n}`, // followed by the rule title from the card
    tier: {
      five_minute: 'Five-minute drill',
      uncomfortable: 'Uncomfortable drill',
      daily: 'Daily drill',
    },
    // Shown on uncomfortable/daily days: swaps in the card's five_minute drill.
    fiveMinuteFallback: 'Only have five minutes',
    backToFull: 'Back to today’s drill',
    did: 'Did it',
    dodged: 'Dodged it',
    // VoiceOver (CLAUDE.md non-negotiable)
    a11y: {
      did: 'Did it. Log today’s drill as done.',
      dodged: 'Dodged it. Log today’s drill as dodged.',
    },
  },

  // ── Today: after answering ───────────────────────────────────────────────
  answered: {
    // Did it → the rule's mantra is shown under this line (brief: mantra = celebration copy).
    done: 'Done.',
    // Dodged → no lecture.
    dodged: 'Logged. Same time tomorrow.',
    nextUnlocks: 'Next drill unlocks tomorrow morning.',
    undo: 'Undo',
  },

  // ── Evening report-back (optional, 1–3 sentences, saved to Journal) ─────
  evening: {
    // Prompt depends on the answer. Wording of both prompts is from the brief.
    promptDone: 'What did it cost you?',
    promptDodged: 'What did you learn?',
    placeholder: 'One to three sentences.',
    save: 'Save',
    skip: 'Skip',
    saved: 'In the journal.',
    tooLong: 'Keep it to three sentences.',
  },

  // ── Milestones (days 12, 24, 36, 45). Part name + subtitle come from content/.
  // No badges, no confetti.
  milestone: {
    // e.g. "FIRE is done."
    headline: (partName: string) => `${partName} is done.`,
    // e.g. "Four rules. Twelve days. FORGE starts tomorrow."
    body: (rules: number, days: number, nextPart?: string) =>
      nextPart
        ? `${spell(rules)} rules. ${spell(days)} days. ${nextPart} starts tomorrow.`
        : `${spell(rules)} rules. ${spell(days)} days. All fifteen rules, done.`,
    cta: 'Keep going',
  },

  // ── Offline ─────────────────────────────────────────────────────────────
  offline: 'Offline. Saved on this phone. Syncs when you’re back.',
} as const;

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
function spell(n: number): string {
  const w = WORDS[n];
  return w ? w[0].toUpperCase() + w.slice(1) : String(n);
}
