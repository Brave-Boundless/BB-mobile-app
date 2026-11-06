// status: approved — Mark delegated the call ("make a judgement call"), 2026-11-06
//
// Copy for passport stamps. The stamps are brand artwork (Box: identity/passport
// stamps); rule titles come from content/. A stamp is earned when all 3 of a
// rule's spine days are answered — Did it or Dodged it. No pop-up when one is
// earned: it simply appears in the Passport (Progress) and on the rule page.

export const stampsCopy = {
  status: 'approved',

  // ── Passport (on Progress) ───────────────────────────────────────────────
  passport: {
    title: 'Passport',
    hint: 'One stamp per rule. Answer all three days to earn it.',
    count: (n: number) => `${n} of 15 stamped`,
  },

  // ── Rule detail (top of "Your record") ───────────────────────────────────
  rule: {
    stamped: (done: number) => `Stamped. ${done} of 3 done.`,
    notYet: 'Not stamped yet. Answer all three days.',
  },

  // ── Screen reader ────────────────────────────────────────────────────────
  a11y: {
    earned: (n: number, title: string, done: number) => `Rule ${n}, ${title}. Stamped. ${done} of 3 done.`,
    notYet: (n: number, title: string) => `Rule ${n}, ${title}. Not stamped yet.`,
  },
} as const;
