import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type BaseAnimationBuilder,
} from 'react-native-reanimated';

import { duration, enter, reveal, settle } from '@/theme/motion';

interface MotionProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Rises into place. `index` staggers siblings; `base` delays the whole group. */
export function Rise({
  index = 0,
  base = 0,
  exiting,
  layout = false,
  ...rest
}: MotionProps & { index?: number; base?: number; exiting?: BaseAnimationBuilder; layout?: boolean }) {
  return <Animated.View entering={enter(index, base)} exiting={exiting} layout={layout ? settle : undefined} {...rest} />;
}

/** A line that appears after something happens, e.g. the mantra after Did it. */
export function Reveal({ delay, ...rest }: MotionProps & { delay?: number }) {
  return <Animated.View entering={reveal(delay)} {...rest} />;
}

/** Siblings below slide smoothly when this block changes height. */
export function Settle(props: MotionProps) {
  return <Animated.View layout={settle} {...props} />;
}

/** A short ember rule that draws itself left to right (milestones). */
export function GrowLine({ width = 64, delay = 200, color }: { width?: number; delay?: number; color: string }) {
  const reduce = useReducedMotion();
  const w = useSharedValue(reduce ? width : 0);
  useEffect(() => {
    if (!reduce) w.set(withDelay(delay, withTiming(width, { duration: duration.slow })));
  }, [reduce, delay, width, w]);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View accessible={false} style={[{ height: 3, backgroundColor: color }, style]} />;
}
