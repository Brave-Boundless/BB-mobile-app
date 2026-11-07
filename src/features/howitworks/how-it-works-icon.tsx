import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { howItWorksCopy } from '@copy/howitworks';

/**
 * A small square "?" that opens How this works. Square to match the brand;
 * the hit area is 44 × 44 even though the mark is smaller.
 */
export function HowItWorksIcon({ testID = 'how-it-works-icon' }: { testID?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={howItWorksCopy.link}
      hitSlop={8}
      onPress={() => router.push('/how-it-works')}
      testID={testID}
      className="h-11 w-11 items-center justify-center active:opacity-60">
      <View className="h-7 w-7 items-center justify-center border border-ash">
        <Text className="font-bold text-base leading-5 text-ash" importantForAccessibility="no">
          ?
        </Text>
      </View>
    </Pressable>
  );
}
