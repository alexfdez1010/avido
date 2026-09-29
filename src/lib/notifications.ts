import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { computeStreak, useGame } from '@/store/game';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { dayKey } from './dates';
import { companionReminder } from './companion';
import { tx } from '@/i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: tx('Recordatorios de lectura', 'Reading reminders'),
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#3DD68C',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function scheduleReminders() {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const { reminders, reminderHour, dailyGoalMin, onboarded } = useSettings.getState();
    if (!reminders || !onboarded) return;
    if (!(await ensurePermission())) return;
    const game = useGame.getState();
    const streak = computeStreak(game.days);
    const today = game.days[dayKey()];
    const book = Object.values(useLibrary.getState().books)
      .filter((b) => b.lastOpenedAt && !b.finishedAt && !b.missing)
      .sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))[0];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(reminderHour, 0, 0, 0);
      if (i === 0 && (today?.goalMet || date.getTime() < Date.now())) continue;
      await Notifications.scheduleNotificationAsync({
        content: companionReminder({ goal: dailyGoalMin, seconds: i === 0 ? today?.sec : 0, bookTitle: book?.title, variant: i }),
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'reminders' },
      });
    }
    if (streak > 0 && !today?.goalMet) {
      const late = new Date();
      late.setHours(22, 30, 0, 0);
      if (late.getTime() > Date.now() && reminderHour < 22)
        await Notifications.scheduleNotificationAsync({
          content: { ...companionReminder({ goal: dailyGoalMin, seconds: today?.sec, bookTitle: book?.title }), title: tx('Miga · ¿Unas páginas antes de dormir?', 'Miga · A few pages before bed?') },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: late, channelId: 'reminders' },
        });
    }
  } catch {}
}
