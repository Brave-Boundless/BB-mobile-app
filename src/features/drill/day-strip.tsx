import { View } from 'react-native';

import { partColor } from '@/content/art';
import { palette } from '@/theme';
import type { PartId } from '@/content';

import type { PipState } from './structure';

const partOf = (rule: number): PartId => (rule <= 4 ? 1 : rule <= 8 ? 2 : rule <= 12 ? 3 : 4) as PartId;

/**
 * The 45 days as one strip of bars, three per rule: done = ember, dodged =
 * grey, today = bone, ahead = the rule's part colour, dimmed. The position is
 * also read out in words (`label`), so meaning never rests on colour alone.
 */
export function DayStrip({ rows, label, testID }: { rows: readonly (readonly PipState[])[]; label: string; testID?: string }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} testID={testID} className="flex-row gap-1">
      {rows.map((r, i) => (
        <View key={i} className="flex-1 flex-row" style={{ gap: 1 }}>
          {r.map((p, j) => (
            <View
              key={j}
              className="flex-1"
              style={{
                height: 8,
                backgroundColor:
                  p === 'done' ? palette.ember.DEFAULT : p === 'dodged' ? palette.ash : p === 'current' ? palette.bone : partColor[partOf(i + 1)],
                opacity: p === 'ahead' ? 0.45 : 1,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
