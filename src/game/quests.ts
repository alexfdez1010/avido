import { daySeed } from '@/lib/dates';
import { seededRandom } from '@/lib/hash';

import type { DayLog } from './types';
import { tx } from '@/i18n';

export type Quest = {
  id: string;
  title: string;
  hint: string;
  target: number;
  xp: number;
  progress: (d: DayLog) => number;
};

type QuestFactory = (goalMin: number) => Quest;

const POOL: QuestFactory[] = [
  (g) => {
    const target = Math.max(10, Math.round((g * 1.5) / 5) * 5);
    return { id: `min${target}`, title: tx(`Lee ${target} minutos`, `Read ${target} minutes`), hint: tx('Supera tu meta diaria', 'Beat your daily goal'), target, xp: 60, progress: (d) => Math.floor(d.sec / 60) };
  },
  () => ({ id: 'pages10', title: tx('Avanza 10 páginas', 'Read 10 pages'), hint: tx('Páginas nuevas, no repasos', 'New pages, no rereads'), target: 10, xp: 50, progress: (d) => Math.floor(d.pages) }),
  () => ({ id: 'pages25', title: tx('Avanza 25 páginas', 'Read 25 pages'), hint: tx('Un buen bocado', 'A good bite'), target: 25, xp: 90, progress: (d) => Math.floor(d.pages) }),
  () => ({ id: 'sessions2', title: tx('Dos sesiones hoy', 'Two sessions today'), hint: tx('Vuelve más tarde a por más', 'Come back later for more'), target: 2, xp: 45, progress: (d) => d.sessions }),
  () => ({ id: 'sessions3', title: tx('Tres sesiones hoy', 'Three sessions today'), hint: tx('Mañana, tarde y noche', 'Morning, afternoon and night'), target: 3, xp: 70, progress: (d) => d.sessions }),
  () => ({ id: 'long20', title: tx('Sesión de 20 minutos', '20-minute session'), hint: tx('Sin salir del libro', 'Without leaving the book'), target: 20, xp: 70, progress: (d) => Math.floor(d.longest / 60) }),
  () => ({ id: 'chapter', title: tx('Termina un capítulo', 'Finish a chapter'), hint: tx('Llega al final de uno', 'Reach the end of one'), target: 1, xp: 40, progress: (d) => d.chapters }),
  () => ({ id: 'chapters2', title: tx('Termina dos capítulos', 'Finish two chapters'), hint: tx('Ritmo de maratón', 'Marathon pace'), target: 2, xp: 75, progress: (d) => d.chapters }),
  () => ({ id: 'early', title: tx('Lee antes de las 9:00', 'Read before 9:00'), hint: tx('Madrugar tiene premio', 'The early bird gets the XP'), target: 1, xp: 50, progress: (d) => (d.early ? 1 : 0) }),
  () => ({ id: 'late', title: tx('Lee después de las 22:00', 'Read after 22:00'), hint: tx('Una página antes de dormir', 'A page before bed'), target: 1, xp: 45, progress: (d) => (d.late ? 1 : 0) }),
  () => ({ id: 'newbook', title: tx('Empieza un libro nuevo', 'Start a new book'), hint: tx('Abre uno que no hayas tocado', "Open one you haven't touched"), target: 1, xp: 55, progress: (d) => d.newBooks }),
];

export function questsForDay(key: string, goalMin: number): Quest[] {
  const rand = seededRandom(daySeed(key) * 7919);
  const idx = POOL.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const picked: Quest[] = [POOL[0](goalMin)];
  for (const i of idx) {
    if (picked.length >= 3) break;
    if (i === 0) continue;
    const q = POOL[i](goalMin);
    if (picked.some((p) => p.id.replace(/\d+/g, '') === q.id.replace(/\d+/g, ''))) continue;
    picked.push(q);
  }
  return picked;
}
