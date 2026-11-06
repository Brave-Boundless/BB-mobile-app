// status: draft — awaiting Mark's approval
//
// Copy for passport stamps (badges). The stamps themselves are brand artwork
// (Box: identity/passport stamps); rule titles and part names come from
// content/. A stamp is earned when all 3 of a rule's days are answered.

export const stampsCopy = {
  status: 'draft',

  // ── The moment a stamp is earned (after answering a rule's 3rd day) ────
  earned: {
    headline: 'Stamped.',
    rule: (n: number, title: string) => `Rule ${n} · ${title}`,
    tally: (done: number) => `${done} of 3 done`,
    cta: 'Keep going',
  },

  // ── Passport (on Progress) ───────────────────────────────────────────────
  passport: {
    title: 'Passport',
    hint: 'One stamp per rule. Answer all three days to earn it.',
    count: (n: number) => `${n} of 15 stamped`,
  },

  // ── Rule detail ──────────────────────────────────────────────────────────
  rule: {
    notYet: 'Not stamped yet. Answer all three days.',
  },

  // ── Screen reader ────────────────────────────────────────────────────────
  a11y: {
    earned: (n: number, title: string, done: number) => `Rule ${n}, ${title}. Stamped. ${done} of 3 done.`,
    notYet: (n: number, title: string) => `Rule ${n}, ${title}. Not stamped yet.`,
  },
} as const;
