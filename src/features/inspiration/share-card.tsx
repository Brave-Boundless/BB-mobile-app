import type { ComponentRef, Ref } from 'react';
import { Text, View } from 'react-native';

import { inspirationCopy as copy } from '@copy/inspiration';
import type { Passage } from '@/content';
import { palette } from '@/theme';

// Layout size of the card. captureRef writes it out at 1080 x 1920 (9:16, the
// Instagram Stories size), so text is sized for this box and scales up 3x.
export const CARD = { width: 360, height: 640 } as const;

/**
 * The image people share: the passage on the brand black, one ember line,
 * then "Mark A. Nead · Brave & Boundless" and the site. Square, no frame.
 * Rendered off screen only while sharing.
 */
export function ShareCard({
  passage,
  ruleTitle,
  ref,
}: {
  passage: Passage;
  ruleTitle: string;
  ref?: Ref<ComponentRef<typeof View>>;
}) {
  // Long passages get a smaller size so every one fits the card.
  const len = passage.text.length;
  const size = len > 260 ? 19 : len > 170 ? 22 : len > 100 ? 26 : 30;
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: CARD.width, height: CARD.height, backgroundColor: palette.charcoal[950], padding: 36, justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: 'Jost_700Bold', fontSize: 11, letterSpacing: 3, color: palette.ash }}>ONLY THE BRAVE BECOME BOUNDLESS</Text>
      <View>
        <Text style={{ fontFamily: 'Jost_500Medium', fontSize: size, lineHeight: size * 1.35, color: palette.bone }}>{passage.text}</Text>
        <View style={{ marginTop: 24, width: 56, height: 3, backgroundColor: palette.ember.DEFAULT }} />
        <Text style={{ marginTop: 16, fontFamily: 'Jost_500Medium', fontSize: 13, color: palette.ash }}>{ruleTitle}</Text>
      </View>
      <View>
        <Text style={{ fontFamily: 'Jost_700Bold', fontSize: 14, color: palette.bone }}>{copy.share.attribution}</Text>
        <Text style={{ marginTop: 4, fontFamily: 'Jost_500Medium', fontSize: 13, color: palette.ember.DEFAULT }}>{copy.share.site}</Text>
      </View>
    </View>
  );
}
