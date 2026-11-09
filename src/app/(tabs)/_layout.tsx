import { Tabs } from 'expo-router/js-tabs';

import { Image, Platform, type ColorValue, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { navigationCopy } from '@copy/navigation';
import { SignUpScreen } from '@/features/account/signup-screen';
import { accountsRequired, useAuthState } from '@/features/account/session';
import { answeredCount } from '@/features/drill/structure';
import { useDrillStore } from '@/features/drill/store';
import { useOffline } from '@/features/drill/use-sync';
import { fontFamily, palette } from '@/theme';

// Icon + label tabs (redesign step 2). Icons are white PNGs tinted with the tab colour.
const icon = (source: ImageSourcePropType) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Image source={source} style={{ width: 24, height: 24, tintColor: color }} accessibilityIgnoresInvertColors />;
  };
const icons = {
  today: icon(require('../../../assets/images/tabs/today.png')),
  path: icon(require('../../../assets/images/tabs/path.png')),
  journal: icon(require('../../../assets/images/tabs/journal.png')),
  ask: icon(require('../../../assets/images/tabs/ask.png')),
  community: icon(require('../../../assets/images/tabs/community.png')),
};

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
          // The browser preview has no safe-area inset to grow into; give icon + label room.
          ...(Platform.OS === 'web' ? { height: 60, paddingBottom: 6 } : null),
        },
        tabBarLabelStyle: { fontFamily: fontFamily.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: palette.charcoal[950] },
      }}>
      <Tabs.Screen name="index" options={{ title: tabs.today, tabBarIcon: icons.today }} />
      <Tabs.Screen name="path" options={{ title: tabs.path, tabBarIcon: icons.path }} />
      <Tabs.Screen name="journal" options={{ title: tabs.journal, tabBarIcon: icons.journal }} />
      <Tabs.Screen name="ask" options={{ title: tabs.askMark, tabBarIcon: icons.ask }} />
      <Tabs.Screen name="community" options={{ title: tabs.community, tabBarIcon: icons.community }} />
    </Tabs>
  );
}
