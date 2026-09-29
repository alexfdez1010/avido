import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { computeStreak, useGame } from '@/store/game';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { dayKey } from './dates';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Recordatorios de lectura',
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
  (s: number) => (s > 1 ? `Tu racha de ${s} días está en juego` : 'Tu próxima racha empieza hoy'),
  () => 'Diez minutos. Solo diez. El libro te espera.',
  (s: number) => (s > 0 ? `No dejes que se apague la llama de ${s} días` : 'Enciende la llama: lee unas páginas'),
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
    const body = book ? `Sigue con «${book.title}» · meta: ${dailyGoalMin} min` : `Tu meta de hoy: ${dailyGoalMin} minutos`;
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
          content: { title: `Último aviso: ${streak} días en riesgo`, body: 'Queda poco para medianoche. Unas páginas bastan.' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: late, channelId: 'reminders' },
        });
    }
  } catch {}
}
