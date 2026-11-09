import { Stack } from 'expo-router';

import { navigationCopy } from '@copy/navigation';
import { LibraryScreen } from '@/features/inspiration/library-screen';

export default function PassagesRoute() {
  return (
    <>
      <Stack.Screen options={{ title: navigationCopy.rulesTabs.passages }} />
      <LibraryScreen embedded />
    </>
  );
}
