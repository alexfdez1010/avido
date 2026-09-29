import { tx } from '@/i18n';

/** Build reminders using the actual minutes remaining for the scheduled day. */
export function companionReminder({ goal, seconds = 0, bookTitle, variant = 0 }: {
  goal: number; seconds?: number; bookTitle?: string; variant?: number;
}) {
  const minutes = Math.max(0, Math.ceil(goal - seconds / 60));
  const titles = [
    tx('Miga · ¿Leemos un ratito?', 'Miga · A little reading together?'),
    tx('Miga · Te guardo el sitio', 'Miga · I saved your place'),
    tx('Miga · Una pausa entre páginas', 'Miga · A pause between pages'),
  ];
  return {
    title: titles[variant % titles.length],
    body: bookTitle
      ? tx(`«${bookTitle}» · ${minutes} min para tu meta.`, `“${bookTitle}” · ${minutes} min to your goal.`)
      : tx(`Tu meta: ${minutes} min de lectura.`, `Your goal: ${minutes} min of reading.`),
  };
}
