import { Stack } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { howItWorksCopy as copy } from '@copy/howitworks';
import { Rise } from '@/components/motion';

/** How this works: the daily drills explained, in approved copy. Static. */
export function HowItWorksScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView className="flex-1 bg-charcoal-950" contentContainerClassName="px-6 pb-12 pt-2" testID="how-it-works">
        <Text accessibilityRole="header" className="font-bold text-3xl uppercase tracking-wide text-bone">
          {copy.title}
        </Text>
        <Text className="mt-3 font-medium text-xl leading-8 text-bone">{copy.intro}</Text>
        {copy.sections.map((s, i) => (
          <Rise key={s.heading} index={i} base={60}>
            <View className="mt-8">
              <Text accessibilityRole="header" className="font-medium text-sm uppercase tracking-widest text-ember-soft">
                {s.heading}
              </Text>
              {s.body.map((line) => (
                <Text key={line} className="mt-2 font-sans text-lg leading-7 text-bone">
                  {line}
                </Text>
              ))}
            </View>
          </Rise>
        ))}
      </ScrollView>
    </>
  );
}
