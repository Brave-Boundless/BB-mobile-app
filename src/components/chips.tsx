import { Pressable, Text, View } from 'react-native';

export interface Chip<K extends string> {
  key: K;
  label: string;
  a11y?: string;
}

/** A row of square one-tap choices. The selected one fills with the accent. */
export function Chips<K extends string>({
  chips,
  selected,
  onSelect,
  testID,
}: {
  chips: readonly Chip<K>[];
  selected?: K | null;
  onSelect: (k: K) => void;
  testID?: string;
}) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2" testID={testID}>
      {chips.map((c) => {
        const on = c.key === selected;
        return (
          <Pressable
            key={c.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={c.a11y ?? c.label}
            testID={testID ? `${testID}-${c.key}` : undefined}
            onPress={() => onSelect(c.key)}
            className={`min-h-12 justify-center border px-4 active:opacity-80 ${on ? 'border-ember bg-ember' : 'border-charcoal-700 bg-charcoal-900'}`}>
            <Text className={`font-medium text-base ${on ? 'text-charcoal-950' : 'text-bone'}`}>{c.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
