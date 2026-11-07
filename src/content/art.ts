import type { ImageSourcePropType } from 'react-native';

import { palette } from '@/theme';

import type { PartId, RuleId } from './types';

// Book illustrations from Box `Brave & Boundless/Book/art` (finals, confirmed by Mark).
// `ratio` is width / height. Every chapter illustration is shown 3:4 portrait
// (Mark, 2026-11-07); the files are 3:4 (or within 4px of it), and the app
// crops to exactly 3:4 with `cover`.
//
// Rule 8 (No Costume, Just You) uses `no costume-2` (masked runner), not the
// book's topless version, which App Store / Play rules treat as nudity.

export type Art = { source: ImageSourcePropType; ratio: number };

const PORTRAIT = 3 / 4;

export const chapterArt: Partial<Record<RuleId, Art>> = {
  1: { source: require('../../assets/images/chapters/01.webp'), ratio: PORTRAIT },
  2: { source: require('../../assets/images/chapters/02.webp'), ratio: PORTRAIT },
  3: { source: require('../../assets/images/chapters/03.webp'), ratio: PORTRAIT },
  4: { source: require('../../assets/images/chapters/04.webp'), ratio: PORTRAIT },
  5: { source: require('../../assets/images/chapters/05.webp'), ratio: PORTRAIT },
  6: { source: require('../../assets/images/chapters/06.webp'), ratio: PORTRAIT },
  7: { source: require('../../assets/images/chapters/07.webp'), ratio: PORTRAIT },
  8: { source: require('../../assets/images/chapters/08.webp'), ratio: PORTRAIT },
  9: { source: require('../../assets/images/chapters/09.webp'), ratio: PORTRAIT },
  10: { source: require('../../assets/images/chapters/10.webp'), ratio: PORTRAIT },
  11: { source: require('../../assets/images/chapters/11.webp'), ratio: PORTRAIT },
  12: { source: require('../../assets/images/chapters/12.webp'), ratio: PORTRAIT },
  13: { source: require('../../assets/images/chapters/13.webp'), ratio: PORTRAIT },
  14: { source: require('../../assets/images/chapters/14.webp'), ratio: PORTRAIT },
  15: { source: require('../../assets/images/chapters/15.webp'), ratio: PORTRAIT },
};

/** The four pillar illustrations. Transparent, made to sit on the dark ground. */
/** Each part's colour (palette.part), behind its pillar icon. */
export const partColor: Record<PartId, string> = {
  1: palette.part.fire,
  2: palette.part.forge,
  3: palette.part.foundation,
  4: palette.part.field,
};

/** Each part's colour for its name in text, lightened to read on black (palette.partText). */
export const partTextColor: Record<PartId, string> = {
  1: palette.partText.fire,
  2: palette.partText.forge,
  3: palette.partText.foundation,
  4: palette.partText.field,
};

export const partArt: Record<PartId, Art> = {
  1: { source: require('../../assets/images/parts/fire.webp'), ratio: 525 / 988 },
  2: { source: require('../../assets/images/parts/forge.webp'), ratio: 697 / 464 },
  3: { source: require('../../assets/images/parts/foundation.webp'), ratio: 597 / 792 },
  4: { source: require('../../assets/images/parts/field.webp'), ratio: 509 / 860 },
};

/** "Your Move": the book's closing image. Shown on the Day 45 wrap-up. */
export const yourMoveArt: Art = { source: require('../../assets/images/your-move.webp'), ratio: 772 / 1024 };
