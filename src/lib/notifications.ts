import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { computeStreak, useGame } from '@/store/game';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { dayKey } from './dates';
import { tx } from '@/i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: tx('Recordatorios de lectura', 'Reading reminders'),
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#FF5B24',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

const DAILY = [
  (s: number) => (s > 1 ? tx(`Tu racha de ${s} días está en juego`, `Your ${s}-day streak is on the line`) : tx('Tu próxima racha empieza hoy', 'Your next streak starts today')),
  () => tx('Diez minutos. Solo diez. El libro te espera.', 'Ten minutes. Just ten. Your book is waiting.'),
  (s: number) => (s > 0 ? tx(`No dejes que se apague la llama de ${s} días`, `Don't let your ${s}-day flame go out`) : tx('Enciende la llama: lee unas páginas', 'Light the flame: read a few pages')),
];

export async function scheduleReminders() {
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
    const body = book ? tx(`Sigue con «${book.title}» · meta: ${dailyGoalMin} min`, `Continue “${book.title}” · goal: ${dailyGoalMin} min`) : tx(`Tu meta de hoy: ${dailyGoalMin} minutos`, `Today's goal: ${dailyGoalMin} minutes`);
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(reminderHour, 0, 0, 0);
      if (i === 0 && (today?.goalMet || date.getTime() < Date.now())) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: DAILY[i % DAILY.length](streak), body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'reminders' },
      });
    }
    if (streak > 0 && !today?.goalMet) {
      const late = new Date();
      late.setHours(22, 30, 0, 0);
      if (late.getTime() > Date.now() && reminderHour < 22)
        await Notifications.scheduleNotificationAsync({
          content: { title: tx(`Último aviso: ${streak} días en riesgo`, `Last call: ${streak} days at risk`), body: tx('Queda poco para medianoche. Unas páginas bastan.', "Midnight is close. A few pages will do.") },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: late, channelId: 'reminders' },
        });
    }
  } catch {}
}
