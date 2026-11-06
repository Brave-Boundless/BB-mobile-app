import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { PRESSED_SCALE, pressSpring } from '@/theme/motion';

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** VoiceOver/TalkBack label when it should say more than the visible text. */
  accessibilityLabel?: string;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  testID?: string;
}

const base = {
  primary: 'min-h-14 items-center justify-center rounded-xl bg-ember px-6',
  secondary: 'min-h-14 items-center justify-center rounded-xl border border-charcoal-700 bg-charcoal-900 px-6',
  text: 'min-h-12 items-center justify-center px-2',
} as const;

const label = {
  primary: 'font-bold text-lg text-charcoal-950',
  secondary: 'font-bold text-lg text-bone',
  text: 'font-medium text-base text-ember-soft',
} as const;

/** Large, high-contrast touch targets (>= 48pt). Text scales with Dynamic Type. */
export function Button({ label: text, onPress, accessibilityLabel, variant = 'primary', disabled, testID }: ButtonProps) {
  // Press feedback: a firm spring down to 97% and back. Text buttons don't scale.
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const animate = variant !== 'text' && !reduce && !disabled;

  return (
    <Animated.View style={pressStyle}>
    <Pressable
      onPressIn={animate ? () => scale.set(withSpring(PRESSED_SCALE, pressSpring)) : undefined}
      onPressOut={animate ? () => scale.set(withSpring(1, pressSpring)) : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      className={`${base[variant]} ${disabled ? 'opacity-50' : 'active:opacity-80'}`}>
      <Text className={label[variant]}>{text}</Text>
    </Pressable>
    </Animated.View>
  );
}
