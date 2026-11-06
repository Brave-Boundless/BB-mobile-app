import { Image, View, useWindowDimensions, type DimensionValue } from 'react-native';

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
 * A pillar illustration. They are transparent cut-outs with a lot of black in
 * them (anvil, block), so they sit on a bone tile — the brand's paper — not on
 * the black ground, where the black would disappear.
 */
export function PillarArt({ art, size, testID }: { art: Art; size: DimensionValue; testID?: string }) {
  return (
    <View testID={testID} className="items-center justify-center bg-bone" style={{ width: size, aspectRatio: 1 }}>
      <Image
        {...decorative}
        source={art.source}
        resizeMode="contain"
        style={{ width: '82%', height: '82%' }}
      />
    </View>
  );
}
