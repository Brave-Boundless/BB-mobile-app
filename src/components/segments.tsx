import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface Segment {
  key: string;
  label: string;
  render: () => ReactNode;
}

/**
 * A tab with segments across the top (Rules · Progress · Passages,
 * Journal · Settings). Square, one accent: the active segment is underlined in
 * ember. Each segment's screen is rendered `embedded`, so it skips its own
 * safe-area padding and title.
 */
export function SegmentedTab({
  segments,
  initial,
  accessory,
}: {
  segments: Segment[];
  initial?: string;
  /** Shown at the right end of the segment bar (e.g. the How this works icon). */
  accessory?: ReactNode;
}) {
  const [active, setActive] = useState(initial ?? segments[0].key);
  const current = segments.find((s) => s.key === active) ?? segments[0];
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-charcoal-950">
      <View className="flex-row border-b border-charcoal-700 px-6 pt-4">
        <View accessibilityRole="tablist" className="flex-row">
          {segments.map((s) => {
            const on = s.key === current.key;
            return (
              <Pressable
                key={s.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                testID={`segment-${s.key}`}
                onPress={() => setActive(s.key)}
                className={`mr-6 min-h-12 justify-center border-b-2 ${on ? "border-ember" : "border-transparent"}`}
              >
                <Text
                  className={`font-bold text-base uppercase tracking-wide ${on ? "text-bone" : "text-ash"}`}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {accessory ? (
          <View className="ml-auto justify-center">{accessory}</View>
        ) : null}
      </View>
      <View className="flex-1">{current.render()}</View>
    </SafeAreaView>
  );
}
