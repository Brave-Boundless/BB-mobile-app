// Motion language for Brave & Boundless.
//
// Restrained on purpose: the brief rules out confetti and badges. Things rise
// a few points and fade in, settle with a firm (not bouncy) spring, and
// stagger so a screen reads top to bottom. Nothing loops, nothing flashes.
//
// Accessibility: Reanimated layout animations default to ReduceMotion.System,
// so with "Reduce Motion" on they jump to the end state. Hand-driven
// animations use useReducedMotion() and skip themselves.

import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  ZoomIn,
} from 'react-native-reanimated';

export const duration = {
  fast: 160,
  base: 280,
  slow: 520,
} as const;

/** Gap between items in a staggered list. Capped so long lists don't drag. */
export const STAGGER = 50;
const MAX_STAGGER_ITEMS = 8;
export const staggerDelay = (index: number, base = 0) => base + Math.min(index, MAX_STAGGER_ITEMS) * STAGGER;

const ease = Easing.out(Easing.cubic);

/**
 * Default entrance: rise into place and fade in.
 * Uses the stock FadeInDown offset on purpose: customising it with
 * withInitialValues makes Reanimated's web build leave the element
 * position: absolute after the animation, stacking sections on top of each
 * other (seen on Progress). Native is unaffected, but web is our preview.
 */
export const enter = (index = 0, base = 0) =>
  FadeInDown.duration(duration.base).easing(ease).delay(staggerDelay(index, base)).reduceMotion(ReduceMotion.System);

/** Lines that reveal after an action (mantra after Did it). */
export const reveal = (delay = 120) =>
  FadeInUp.duration(duration.slow).easing(ease).delay(delay).reduceMotion(ReduceMotion.System);

export const fadeIn = (delay = 0) => FadeIn.duration(duration.base).delay(delay).reduceMotion(ReduceMotion.System);
export const fadeOut = FadeOut.duration(duration.fast).reduceMotion(ReduceMotion.System);

/** Rule-map cells: a small, quick scale-up. */
export const pop = (index = 0) =>
  ZoomIn.duration(duration.base).easing(ease).delay(staggerDelay(index)).reduceMotion(ReduceMotion.System);

/** Siblings slide into place when something above them grows, shrinks or leaves. */
export const settle = LinearTransition.duration(duration.base).easing(ease).reduceMotion(ReduceMotion.System);

/** Press feedback for buttons: firm spring, no overshoot to speak of. */
export const pressSpring = { damping: 18, stiffness: 320, mass: 0.6 } as const;
export const PRESSED_SCALE = 0.97;
