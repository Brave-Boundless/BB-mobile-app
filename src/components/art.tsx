import { Image, View, useWindowDimensions } from 'react-native';

import type { Art } from '@/content/art';

// Book art is decoration next to text that already names the rule, so screen
// readers skip it.
const decorative = { accessible: false, importantForAccessibility: 'no' as const };

/**
 * A chapter illustration at its natural shape, as wide as the screen's text
 * column (screen minus the 24pt gutters). Sized in points, not `width: 100%` +
 * `aspectRatio`, which react-native-web lays out as a cropped strip.
 */
export function ChapterArt({ art, gutter = 24, testID }: { art: Art; gutter?: number; testID?: string }) {
  const { width: screen } = useWindowDimensions();
  const width = Math.min(screen, 560) - gutter * 2;
  return (
    <Image
      {...decorative}
      testID={testID}
      source={art.source}
      resizeMode="cover"
      style={{ width, height: Math.round(width / art.ratio) }}
    />
  );
}

/** A small crop of a chapter illustration (list rows, Today). */
export function ArtThumb({ art, width = 56, testID }: { art: Art; width?: number; testID?: string }) {
  return (
    <Image
      {...decorative}
      testID={testID}
      source={art.source}
      resizeMode="cover"
      style={{ width, height: Math.round(width * 4 / 3) }}
    />
  );
}

/**
 * A pillar illustration on its part's colour (FIRE red, FORGE orange,
 * FOUNDATION slate, FIELD olive), as on the book and the website. The icons
 * are transparent cut-outs with a lot of black, so they never sit directly on
 * the black ground. The files are trimmed to the drawing, so 78% of the circle
 * fills it while every corner of the drawing stays inside the edge.
 */
export function PillarArt({ art, size, color, testID }: { art: Art; size: number; color: string; testID?: string }) {
  // A circle, not a square (Mark, 2026-11-07): the one round shape in an
  // otherwise square brand, to break up the blocks of the rule list.
  return (
    <View
      testID={testID}
      className="items-center justify-center overflow-hidden"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}>
      <Image
        {...decorative}
        source={art.source}
        resizeMode="contain"
        style={{ width: '78%', height: '78%' }}
      />
    </View>
  );
}
