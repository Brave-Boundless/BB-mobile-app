// Morning push: local notifications only (works offline, no server cron).

import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { toLocalDate } from './local-date';
import { planMorningNotifications } from './notification-plan';
import type { DrillRecord } from './progress';

const CHANNEL_ID = 'morning-drill';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function notificationsAllowed(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

export async function requestNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Morning drill',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

/** Replaces every scheduled push with the current 7-day plan. */
export async function rescheduleMorningPushes(records: readonly DrillRecord[], notifyAt: string): Promise<void> {
  if (Platform.OS === 'web' || !(await notificationsAllowed())) return;
  const now = new Date();
  const plan = planMorningNotifications(records, now, toLocalDate(now), notifyAt);
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      content: { title: n.title, body: n.body, data: { url: '/' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.fireAt, channelId: CHANNEL_ID },
    });
  }
}
