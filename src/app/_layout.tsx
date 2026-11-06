import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useBackgroundSync } from '@/features/drill/use-sync';
import { queryClient } from '@/lib/query-client';
import { appFonts, palette } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const ready = fontsLoaded || fontError !== null;
  useBackgroundSync();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.charcoal[950] },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="milestone/[part]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
