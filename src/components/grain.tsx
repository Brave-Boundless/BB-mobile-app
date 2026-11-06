import { Image, StyleSheet, View } from 'react-native';

// Film grain over every ground (B&B Design System: "Every ground and every
// photo carries grain"). React Native has no blend modes, so the brand's
// overlay/multiply grain is approximated with light and dark specks at low
// opacity. Purely decorative: no touches, hidden from screen readers.
const GRAIN = require('../../assets/images/grain.png');

/** Opacity tuned so body text keeps well over 4.5:1 (grain shifts it < 3%). */
export const GRAIN_OPACITY = 0.07;

export function Grain() {
  return (
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <Image source={GRAIN} resizeMode="repeat" style={[StyleSheet.absoluteFill, { opacity: GRAIN_OPACITY, width: '100%', height: '100%' }]} />
    </View>
  );
}
