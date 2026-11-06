import type { ImageSourcePropType } from 'react-native';

import type { PartId, RuleId } from './types';

// Book illustrations from Box `Brave & Boundless/Book/art` (finals, confirmed by Mark).
// Each file keeps its natural aspect ratio; `ratio` is width / height.
//
// Rule 8 (No Costume, Just You) uses `no costume-2` (masked runner), not the
// book's topless version, which App Store / Play rules treat as nudity.

export type Art = { source: ImageSourcePropType; ratio: number };

export const chapterArt: Partial<Record<RuleId, Art>> = {
  1: { source: require('../../assets/images/chapters/01.webp'), ratio: 819 / 1024 },
  2: { source: require('../../assets/images/chapters/02.webp'), ratio: 772 / 1024 },
  3: { source: require('../../assets/images/chapters/03.webp'), ratio: 772 / 1024 },
  4: { source: require('../../assets/images/chapters/04.webp'), ratio: 1 },
  5: { source: require('../../assets/images/chapters/05.webp'), ratio: 679 / 1024 },
  6: { source: require('../../assets/images/chapters/06.webp'), ratio: 772 / 1024 },
  7: { source: require('../../assets/images/chapters/07.webp'), ratio: 904 / 1200 },
  8: { source: require('../../assets/images/chapters/08.webp'), ratio: 904 / 1200 },
  9: { source: require('../../assets/images/chapters/09.webp'), ratio: 1117 / 1200 },
  10: { source: require('../../assets/images/chapters/10.webp'), ratio: 772 / 1024 },
  11: { source: require('../../assets/images/chapters/11.webp'), ratio: 904 / 1200 },
  12: { source: require('../../assets/images/chapters/12.webp'), ratio: 904 / 1200 },
  13: { source: require('../../assets/images/chapters/13.webp'), ratio: 772 / 1024 },
  14: { source: require('../../assets/images/chapters/14.webp'), ratio: 839 / 1024 },
  15: { source: require('../../assets/images/chapters/15.webp'), ratio: 772 / 1024 },
};

/** The four pillar illustrations. Transparent, made to sit on the dark ground. */
export const partArt: Record<PartId, Art> = {
  1: { source: require('../../assets/images/parts/fire.webp'), ratio: 1 },
  2: { source: require('../../assets/images/parts/forge.webp'), ratio: 772 / 1024 },
  3: { source: require('../../assets/images/parts/foundation.webp'), ratio: 772 / 1024 },
  4: { source: require('../../assets/images/parts/field.webp'), ratio: 772 / 1024 },
};

/** "Your Move": the book's closing image. Shown on the Day 45 wrap-up. */
export const yourMoveArt: Art = { source: require('../../assets/images/your-move.webp'), ratio: 772 / 1024 };
