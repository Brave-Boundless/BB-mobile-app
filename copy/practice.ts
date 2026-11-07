// status: approved — Mark, 2026-11-07
//
// What happens around the daily answer: rating a done drill, naming what got
// in the way of a dodged one, planning tomorrow, the recap after each rule's
// third drill, and old notes coming back. Tone rules from CLAUDE.md §3 apply:
// short, imperative, no exclamation points, never shame a dodge.

export const practiceCopy = {
  status: 'approved',

  // ── After Did it: how hard was it (optional, one tap) ──────────────────
  rating: {
    prompt: 'How hard was it?',
    scale: ['Easy', 'Doable', 'Challenging', 'Hard', 'Brutal'] as const, // 1–5 (Mark, 2026-11-07)
    a11y: (n: number, label: string) => `${n} of 5, ${label}`,
    skip: 'Skip',
  },

  // ── After Dodged it: what got in the way (optional, one tap) ───────────
  dodge: {
    prompt: 'What got in the way?',
    reasons: {
      fear: 'Fear',
      time: 'No time',
      forgot: 'Forgot',
      point: 'Didn’t see the point',
      other: 'Something else',
    },
    skip: 'Skip',
    // Shown once 3+ reasons are logged and one reason is the most common.
    pattern: (reason: string, n: number) => `Most dodges so far: ${reason.toLowerCase()} (${n}).`,
    askMark: 'Ask Mark about it',
  },

  // ── Plan tomorrow (after answering; one extra push at the chosen time) ──
  plan: {
    // e.g. "Tomorrow: Rule 5, the uncomfortable drill."
    headline: (rule: number, tier: string) => `Tomorrow: Rule ${rule}, the ${tier.toLowerCase()}.`,
    prompt: 'When will you do it?',
    options: { morning: 'Morning', midday: 'Midday', evening: 'Evening', pick: 'Pick a time' },
    set: (time: string) => `Reminder set for ${time}.`,
    change: 'Change',
    none: 'No reminder',
    // The planned-time push. Title = rule title (from content/).
    pushBody: 'This is the time you picked. Your drill is waiting.',
  },

  // ── Rule recap (after a rule's third drill is answered) ─────────────────
  recap: {
    headline: (rule: number) => `Rule ${rule}: three drills, answered.`,
    tally: (done: number, dodged: number) => `${done} done · ${dodged} dodged`,
    hardest: (label: string) => `Hardest: ${label.toLowerCase()}.`,
    notes: 'What you wrote',
    noNotes: 'No notes this time.',
    stamp: 'Stamp earned.',
    next: (rule: number, title: string) => `Next: Rule ${rule}, ${title}.`,
    cta: 'Keep going',
  },

  // ── Ratings over time (Progress and each rule's page) ──────────────────
  trend: {
    title: 'How hard it felt',
    // e.g. "Rule 2 felt brutal on Day 5. Its daily drill felt fine."
    line: (rule: number, firstLabel: string, firstDay: number, lastLabel: string) =>
      `Rule ${rule} felt ${firstLabel.toLowerCase()} on Day ${firstDay}. Its daily drill felt ${lastLabel.toLowerCase()}.`,
    empty: 'Rate your done drills and this fills in.',
  },

  // ── Old notes resurfacing on Today (max once a day, notes ≥ 7 days old) ─
  lookBack: {
    label: (day: number) => `On Day ${day} you wrote`,
    open: 'See it in the journal',
  },
} as const;
