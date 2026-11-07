import { Tabs } from 'expo-router/js-tabs';

import { SafeAreaView } from 'react-native-safe-area-context';

import { navigationCopy } from '@copy/navigation';
import { SignUpScreen } from '@/features/account/signup-screen';
import { accountsRequired, useAuthState } from '@/features/account/session';
import { answeredCount } from '@/features/drill/structure';
import { useDrillStore } from '@/features/drill/store';
import { useOffline } from '@/features/drill/use-sync';
import { fontFamily, palette } from '@/theme';

// Text-only tabs for now. Icons come with the design pass.
export default function TabLayout() {
  const { tabs } = navigationCopy;
  const { loaded, session } = useAuthState();
  const startedOn = useDrillStore((s) => s.startedOn);
  const drills = useDrillStore((s) => s.drills);
  const offline = useOffline();

  // Accounts are required (Mark, 2026-11-07). Someone with progress on this
  // phone and no account signs up before anything else. A first-time reader
  // signs up from Today's "Start Day 1" (after the 45-day intro).
  if (accountsRequired && !loaded) return <SafeAreaView className="flex-1 bg-charcoal-950" />;
  if (accountsRequired && !session && startedOn) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-charcoal-950">
        <SignUpScreen variant="existing" answered={answeredCount({ drills })} offline={offline} />
      </SafeAreaView>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Cross-fade between tabs.
        animation: 'fade',
        tabBarActiveTintColor: palette.ember.soft,
        tabBarInactiveTintColor: palette.ash,
        tabBarStyle: {
          backgroundColor: palette.charcoal[900],
          borderTopColor: palette.charcoal[700],
        },
        tabBarLabelStyle: { fontFamily: fontFamily.medium, fontSize: 13 },
        tabBarIconStyle: { display: 'none' },
        sceneStyle: { backgroundColor: palette.charcoal[950] },
      }}>
      <Tabs.Screen name="index" options={{ title: tabs.today }} />
      <Tabs.Screen name="rules" options={{ title: tabs.rules }} />
      <Tabs.Screen name="ask" options={{ title: tabs.askMark }} />
      <Tabs.Screen name="community" options={{ title: tabs.community }} />
      <Tabs.Screen name="journal" options={{ title: tabs.journal }} />
    </Tabs>
  );
}
