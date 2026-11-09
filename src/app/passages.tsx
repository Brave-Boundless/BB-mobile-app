import { Stack, useLocalSearchParams } from 'expo-router';

import { navigationCopy } from '@copy/navigation';
import type { RuleId } from '@/content';
import { LibraryScreen } from '@/features/inspiration/library-screen';

/** `/passages`, `/passages?view=saved` (from Journal) or `/passages?rule=5` (a rule's "From the book"). */
export default function PassagesRoute() {
  const { view, rule } = useLocalSearchParams<{ view?: string; rule?: string }>();
  const n = Number(rule);
  const ruleId = Number.isInteger(n) && n >= 1 && n <= 15 ? (n as RuleId) : undefined;
  return (
    <>
      <Stack.Screen options={{ title: navigationCopy.rulesTabs.passages }} />
      <LibraryScreen embedded initialView={view === 'saved' ? 'saved' : undefined} rule={ruleId} />
    </>
  );
}
