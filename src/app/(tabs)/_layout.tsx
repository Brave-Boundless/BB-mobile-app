import { Tabs } from 'expo-router/js-tabs';

import { navigationCopy } from '@copy/navigation';
import { fontFamily, palette } from '@/theme';

// Text-only tabs for now. Icons come with the design pass.
export default function TabLayout() {
  const { tabs } = navigationCopy;
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
      <Tabs.Screen name="you" options={{ title: tabs.you }} />
    </Tabs>
  );
}
