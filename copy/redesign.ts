// status: draft — for Mark's review, 2026-11-09
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
} as const;
