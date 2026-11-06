import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Base screen: charcoal background, safe-area aware, 24pt gutters. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-charcoal-950">
      <View className="flex-1 px-6 pt-6">{children}</View>
    </SafeAreaView>
  );
}

/** Developer placeholder for screens not built yet. Never ships. */
export function NotBuilt({ title, note }: { title: string; note: string }) {
  return (
    <Screen>
      <Text accessibilityRole="header" className="font-bold text-3xl uppercase tracking-wide text-bone">
        {title}
      </Text>
      <Text className="mt-3 font-sans text-base text-ash">{note}</Text>
    </Screen>
  );
}
