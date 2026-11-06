import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useDrillStore } from '@/features/drill/store';
import { resetSyncSession } from '@/features/drill/use-sync';

/** Wipes everything on this phone: drills, journal, settings, scheduled pushes. */
export async function eraseLocalData(): Promise<void> {
  useDrillStore.getState().reset();
  resetSyncSession();
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
}
