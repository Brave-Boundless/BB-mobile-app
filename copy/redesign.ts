// status: draft — steps 1–2 and Journal lines approved by Mark (merged 2026-11-09); step 3 lines for review
//
// Redesign, step 1: the new Today and the screens after answering (Mark,
// 2026-11-09: "simpler and more visual with less text"). Almost everything on
// these screens reuses approved copy (copy/today.ts, copy/practice.ts,
// copy/structure.ts, copy/inspiration.ts). Only the lines below are new.

export const redesignCopy = {
  status: 'draft',

  // Today, top left: the day as a number, e.g. "14 / 45".
  dayOf: (day: number, total: number) => `${day} / ${total}`,
  // Over the chapter art: part name and rule, e.g. "FORGE · RULE 5".
  partChip: (part: string, rule: number) => `${part} · RULE ${rule}`,

  // The screens after Did it / Dodged it, one at a time.
  next: 'Next',
  finish: 'See you tomorrow',

  // ── Step 2: Path (replaces the Rules tab) ───────────────────────────────
  path: {
    title: 'Your path',
  },

  // ── Journal: write anything, any time (Mark) ────────────────────────────
  journal: {
    write: 'Write',
    writeHint: 'Anything, any time',
    placeholder: 'What’s on your mind?',
    // Tag on a free note, where a report-back shows "Day 4 · Rule 2 · Did it".
    note: 'Note',
    // Under Write, once a passage is saved: opens Passages → Saved.
    saved: (n: number) => `Saved passages · ${n}`,
  },

  // ── Step 3: where streak, scorecards and passages live ──────────────────
  // Path, under "N of 45 drills answered · N of 15 stamped", when a streak is live:
  // e.g. "Streak · 4 drills" (reuses the approved streak wording).
  streakLine: (value: string) => `Streak · ${value}`,
  rule: {
    // Rule screen, under the mantra: opens this rule's passages.
    fromTheBook: 'From the book',
    fromTheBookCount: (n: number) => (n === 1 ? '1 passage' : `${n} passages`),
  },
} as const;
