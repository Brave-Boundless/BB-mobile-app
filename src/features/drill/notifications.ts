// Morning push: local notifications only (works offline, no server cron).

import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { toLocalDate } from './local-date';
import { planMorningNotifications } from './notification-plan';
import type { DrillData } from './store';

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
export async function rescheduleMorningPushes(data: DrillData, notifyAt: string = data.notifyAt): Promise<void> {
  if (Platform.OS === 'web' || !(await notificationsAllowed())) return;
  const now = new Date();
  const plan = planMorningNotifications(Object.values(data.drills), now, toLocalDate(now), notifyAt, data);
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      content: { title: n.title, body: n.body, data: { url: '/' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.fireAt, channelId: CHANNEL_ID },
    });
  }
}
