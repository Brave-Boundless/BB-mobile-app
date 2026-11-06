import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { todayCopy as copy } from '@copy/today';
import { Button } from '@/components/button';
import { getPart, type PartId } from '@/content';

// End of a part: days 12, 24, 36, 45. Part name + subtitle are the book's;
// no badges, no confetti (CLAUDE.md §3).
export default function MilestoneScreen() {
  const { part: raw } = useLocalSearchParams<{ part: string }>();
  const id = Number(raw);
  if (![1, 2, 3, 4].includes(id)) return null;
  const part = getPart(id as PartId);
  const next = id < 4 ? getPart((id + 1) as PartId) : undefined;

  return (
    <SafeAreaView className="flex-1 bg-charcoal-950">
      <View className="flex-1 justify-between px-6 pb-8 pt-16">
        <View>
          <Text className="font-medium text-sm uppercase tracking-widest text-ember-soft">{part.subtitle}</Text>
          <Text accessibilityRole="header" className="mt-3 font-bold text-4xl uppercase tracking-wide text-bone">
            {copy.milestone.headline(part.name)}
          </Text>
          <Text className="mt-6 font-sans text-xl text-ash">
            {copy.milestone.body(part.rules.length, part.rules.length * 3, next?.name)}
          </Text>
        </View>
        <Button label={copy.milestone.cta} onPress={() => router.back()} testID="milestone-continue" />
      </View>
    </SafeAreaView>
  );
}
