// status: draft — 2026-11-07
//
// Makes the shape of the 45 days obvious (Mark, 2026-11-07: "make it more
// clear that there are 45 drills, 3 per rule"). Used on first run, on Today,
// on the Rules list and on Progress. Tier names reuse copy/today.ts.

export const structureCopy = {
  status: 'draft',

  // ── First run: one screen before "Start Day 1" ─────────────────────────
  // Shown with a 15 × 3 grid: one row per rule, three cells per row.
  intro: {
    headline: '15 rules. 3 drills each. 45 days.',
    body: 'Every rule gets three days. Each day is a different drill.',
    tiers: {
      five_minute: 'Day 1: the five-minute drill. Get moving.',
      uncomfortable: 'Day 2: the uncomfortable drill. Go where it’s hard.',
      daily: 'Day 3: the daily drill. Make it a habit.',
    },
    pace: 'One drill a day. The next one unlocks the morning after you answer.',
  },

  // ── Today: where this drill sits ───────────────────────────────────────
  // e.g. "Drill 14 of 45 · Rule 5 · Drill 2 of 3"
  position: (overall: number, total: number, rule: number, inRule: number) =>
    `Drill ${overall} of ${total} · Rule ${rule} · Drill ${inRule} of 3`,
  // Three pips under the rule title; VoiceOver reads this instead.
  pipsA11y: (answered: number) => `${answered} of 3 drills for this rule answered`,

  // ── Rules list: three pips per rule (five-minute, uncomfortable, daily) ─
  rulePipsA11y: (done: number, dodged: number) =>
    `${done} done, ${dodged} dodged, ${3 - done - dodged} to go`,

  // ── Progress: replaces "Day N of 45" ───────────────────────────────────
  progress: (answered: number) => `${answered} of 45 drills answered`,
} as const;
