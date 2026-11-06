// Minimal Reanimated stand-in for Jest. Reanimated 4's own mock still boots
// its native worklets runtime, which Jest can't provide. Animated views render
// as plain views; every animation builder chains to itself and does nothing;
// shared values are plain objects. Tests see each screen's final state.
const React = require('react');
const { View, Text, ScrollView, Image } = require('react-native');

const builder = new Proxy(function () {}, {
  get: (_t, prop) => (prop === 'build' ? () => () => ({}) : () => builder),
  apply: () => builder,
});

function strip(Component) {
  return React.forwardRef(function Animated({ entering, exiting, layout, ...props }, ref) {
    return React.createElement(Component, { ...props, ref });
  });
}

const Animated = {
  View: strip(View),
  Text: strip(Text),
  ScrollView: strip(ScrollView),
  Image: strip(Image),
  createAnimatedComponent: strip,
};

const sharedValue = (initial) => {
  const sv = { value: initial, get: () => sv.value, set: (v) => (sv.value = typeof v === 'function' ? v(sv.value) : v) };
  return sv;
};

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue: (v) => React.useRef(sharedValue(v)).current,
  useAnimatedStyle: (fn) => fn(),
  useReducedMotion: () => false,
  withTiming: (v) => v,
  withSpring: (v) => v,
  withDelay: (_d, v) => v,
  Easing: new Proxy({}, { get: () => () => (t) => t }),
  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
  FadeIn: builder,
  FadeOut: builder,
  FadeInDown: builder,
  FadeInUp: builder,
  ZoomIn: builder,
  LinearTransition: builder,
};
