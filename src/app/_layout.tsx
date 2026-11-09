import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Grain } from '@/components/grain';
import { useBackgroundSync } from '@/features/drill/use-sync';
import { useNewsletterOnSignIn } from '@/features/account/use-account-effects';
import { queryClient } from '@/lib/query-client';
import { appFonts, fontFamily, palette } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const ready = fontsLoaded || fontError !== null;
  useBackgroundSync();
  useNewsletterOnSignIn();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: palette.charcoal[950] }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.charcoal[950] },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="rule/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: palette.ember.soft,
            headerStyle: { backgroundColor: palette.charcoal[950] },
            headerShadowVisible: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="how-it-works"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: palette.ember.soft,
            headerStyle: { backgroundColor: palette.charcoal[950] },
            headerShadowVisible: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: palette.ember.soft,
            headerStyle: { backgroundColor: palette.charcoal[950] },
            headerShadowVisible: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="passages"
          options={{
            headerShown: true,
            headerTitleStyle: { fontFamily: fontFamily.bold, color: palette.bone },
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: palette.ember.soft,
            headerStyle: { backgroundColor: palette.charcoal[950] },
            headerShadowVisible: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="progress"
          options={{
            headerShown: true,
            headerTitleStyle: { fontFamily: fontFamily.bold, color: palette.bone },
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: palette.ember.soft,
            headerStyle: { backgroundColor: palette.charcoal[950] },
            headerShadowVisible: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="drill/[rule]/[tier]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: palette.ember.soft,
            headerStyle: { backgroundColor: palette.charcoal[950] },
            headerShadowVisible: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="moderation"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: palette.ember.soft,
            headerStyle: { backgroundColor: palette.charcoal[950] },
            headerShadowVisible: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="group/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: palette.ember.soft,
            headerStyle: { backgroundColor: palette.charcoal[950] },
            headerShadowVisible: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="milestone/[part]" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }} />
      </Stack>
      {/* Film grain over the whole app, above content, never catching touches. */}
      <Grain />
      </View>
    </QueryClientProvider>
  );
}
