import { Stack } from 'expo-router';

import { navigationCopy } from '@copy/navigation';
import { ProgressScreen } from '@/features/progress/progress-screen';

export default function ProgressRoute() {
  return (
    <>
      <Stack.Screen options={{ title: navigationCopy.rulesTabs.progress }} />
      <ProgressScreen embedded />
    </>
  );
}
