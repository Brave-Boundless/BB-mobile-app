import { View } from 'react-native';

import type { PipState } from './structure';

// Square pips. Done = filled accent; dodged = filled grey; today = accent
// outline; ahead = grey outline. The accent is ember unless a `color` is
// given (the rule's part colour on Today and Path). Ahead = grey outline (ash, >= 3:1 on black for
// graphics). Meaning never rests on colour alone: each group carries a
// VoiceOver label and the screens print the count in words.
const style: Record<PipState, string> = {
  done: 'bg-ember border-ember',
  dodged: 'bg-ash border-ash',
  current: 'border-ember',
  ahead: 'border-ash opacity-50',
};

export function Pips({
  pips,
  size = 10,
  label,
  color,
  testID,
}: {
  pips: readonly PipState[];
  size?: number;
  label: string;
  /** Accent for done and today; defaults to ember. */
  color?: string;
  testID?: string;
}) {
  return (
    <View
      accessible={label !== ''}
      importantForAccessibility={label === '' ? 'no-hide-descendants' : 'auto'}
      accessibilityLabel={label || undefined}
      testID={testID}
      className="flex-row gap-1">
      {pips.map((p, i) => (
        <View
          key={i}
          className={`border-2 ${style[p]}`}
          style={[
            { width: size, height: size },
            color && p === 'done' ? { backgroundColor: color, borderColor: color } : null,
            color && p === 'current' ? { borderColor: color } : null,
          ]}
        />
      ))}
    </View>
  );
}

/** 15 rows x 3 pips: the whole 45 days at a glance. */
export function Grid45({ rows, label, testID }: { rows: readonly (readonly PipState[])[]; label: string; testID?: string }) {
  return (
    <View accessible accessibilityLabel={label} testID={testID} className="flex-row flex-wrap gap-x-3 gap-y-2">
      {rows.map((r, i) => (
        <View key={i} className="flex-row gap-1">
          {r.map((p, j) => (
            <View key={j} className={`border-2 ${style[p]}`} style={{ width: 12, height: 12 }} />
          ))}
        </View>
      ))}
    </View>
  );
}
