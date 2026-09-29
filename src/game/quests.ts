import { daySeed } from '@/lib/dates';
import { seededRandom } from '@/lib/hash';

import type { DayLog } from './types';

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
    return { id: `min${target}`, title: `Lee ${target} minutos`, hint: 'Supera tu meta diaria', target, xp: 60, progress: (d) => Math.floor(d.sec / 60) };
  },
  () => ({ id: 'pages10', title: 'Avanza 10 páginas', hint: 'Páginas nuevas, no repasos', target: 10, xp: 50, progress: (d) => Math.floor(d.pages) }),
  () => ({ id: 'pages25', title: 'Avanza 25 páginas', hint: 'Un buen bocado', target: 25, xp: 90, progress: (d) => Math.floor(d.pages) }),
  () => ({ id: 'sessions2', title: 'Dos sesiones hoy', hint: 'Vuelve más tarde a por más', target: 2, xp: 45, progress: (d) => d.sessions }),
  () => ({ id: 'sessions3', title: 'Tres sesiones hoy', hint: 'Mañana, tarde y noche', target: 3, xp: 70, progress: (d) => d.sessions }),
  () => ({ id: 'long20', title: 'Sesión de 20 minutos', hint: 'Sin salir del libro', target: 20, xp: 70, progress: (d) => Math.floor(d.longest / 60) }),
  () => ({ id: 'chapter', title: 'Termina un capítulo', hint: 'Llega al final de uno', target: 1, xp: 40, progress: (d) => d.chapters }),
  () => ({ id: 'chapters2', title: 'Termina dos capítulos', hint: 'Ritmo de maratón', target: 2, xp: 75, progress: (d) => d.chapters }),
  () => ({ id: 'early', title: 'Lee antes de las 9:00', hint: 'Madrugar tiene premio', target: 1, xp: 50, progress: (d) => (d.early ? 1 : 0) }),
  () => ({ id: 'late', title: 'Lee después de las 22:00', hint: 'Una página antes de dormir', target: 1, xp: 45, progress: (d) => (d.late ? 1 : 0) }),
  () => ({ id: 'newbook', title: 'Empieza un libro nuevo', hint: 'Abre uno que no hayas tocado', target: 1, xp: 55, progress: (d) => d.newBooks }),
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
