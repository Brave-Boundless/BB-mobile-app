// Passport stamps: one per rule, earned when all 3 of that rule's spine days
// are answered. Did it or Dodged it both count — showing up earns the stamp;
// the stamp records how many were done (CLAUDE.md decisions log).

import type { ImageSourcePropType } from 'react-native';

import { rules, type RuleId } from '@/content';
import { DAYS_PER_RULE } from '@/features/drill/spine';
import { kindOf, type DrillData } from '@/features/drill/store';

export interface Stamp {
  ruleId: RuleId;
  /** Spine days answered Did it (0–3). */
  done: number;
}

/** The rule's stamp, or undefined until all 3 spine days are answered. */
export function stampFor(data: DrillData, ruleId: RuleId): Stamp | undefined {
  const rows = Object.values(data.drills).filter(
    (d) => kindOf(d) === 'spine' && d.ruleId === ruleId && d.status !== 'pending',
  );
  const days = new Set(rows.map((r) => r.day));
  if (days.size < DAYS_PER_RULE) return undefined;
  return { ruleId, done: rows.filter((r) => r.status === 'done').length };
}

/** Every stamp earned so far, in book order. */
export function earnedStamps(data: DrillData): Stamp[] {
  return rules.map((r) => stampFor(data, r.number)).filter((s): s is Stamp => !!s);
}

/**
 * Stamp art, rendered from the brand's passport-stamp SVGs. Rules 1, 2, 3, 6,
 * 9, 14, 15 are the brand's own stamps; the other 8 were built from the same
 * template. On the dark ground each stamp is inked in its part's text colour
 * (Mark, 2026-11-09), the same as the part headlines: FIRE (1–4) #D64A5D,
 * FORGE (5–8) #D1542C, FOUNDATION (9–12) #6C7F83, FIELD (13–15) #6C825C,
 * all ≥ 4.5:1 on black. Sources: assets/source/stamps (brand inks) and
 * assets/source/stamps/dark (what ships). `ratio` = width / height.
 */
export const stampArt: Record<RuleId, { source: ImageSourcePropType; ratio: number }> = {
  1: { source: require('../../../assets/images/stamps/01.webp'), ratio: 1 },
  2: { source: require('../../../assets/images/stamps/02.webp'), ratio: 480 / 336 },
  3: { source: require('../../../assets/images/stamps/03.webp'), ratio: 480 / 336 },
  4: { source: require('../../../assets/images/stamps/04.webp'), ratio: 480 / 336 },
  5: { source: require('../../../assets/images/stamps/05.webp'), ratio: 480 / 336 },
  6: { source: require('../../../assets/images/stamps/06.webp'), ratio: 480 / 336 },
  7: { source: require('../../../assets/images/stamps/07.webp'), ratio: 480 / 336 },
  8: { source: require('../../../assets/images/stamps/08.webp'), ratio: 1 },
  9: { source: require('../../../assets/images/stamps/09.webp'), ratio: 480 / 336 },
  10: { source: require('../../../assets/images/stamps/10.webp'), ratio: 480 / 336 },
  11: { source: require('../../../assets/images/stamps/11.webp'), ratio: 480 / 336 },
  12: { source: require('../../../assets/images/stamps/12.webp'), ratio: 480 / 336 },
  13: { source: require('../../../assets/images/stamps/13.webp'), ratio: 1 },
  14: { source: require('../../../assets/images/stamps/14.webp'), ratio: 1 },
  15: { source: require('../../../assets/images/stamps/15.webp'), ratio: 480 / 336 },
};
