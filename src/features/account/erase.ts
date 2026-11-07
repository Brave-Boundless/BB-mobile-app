import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useAccountStore } from '@/features/account/account-store';
import { useAskMarkStore } from '@/features/askmark/store';
import { useDrillStore } from '@/features/drill/store';
import { emptyStory, useStoryStore } from '@/features/story/store';
import { resetSyncSession } from '@/features/drill/use-sync';

/** Wipes everything on this phone: drills, journal, Ask Mark chat, story draft, settings, scheduled pushes. */
export async function eraseLocalData(): Promise<void> {
  useDrillStore.getState().reset();
  useAskMarkStore.getState().reset();
  useAccountStore.getState().reset();
  useStoryStore.setState({ draft: emptyStory });
  resetSyncSession();
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
}
