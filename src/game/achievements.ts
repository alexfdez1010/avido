import { isEs } from '@/i18n';

export type AchievementContext = {
  totalSec: number;
  totalPages: number;
  finished: number;
  bestStreak: number;
  longestSession: number;
  librarySize: number;
  goalsMet: number;
  questsDone: number;
  level: number;
  booksOpened: number;
  nightOwl: boolean;
  earlyBird: boolean;
  weekend: boolean;
  speedReader: boolean;
};

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  glyph: string;
  xp: number;
  metric: (c: AchievementContext) => number;
  target: number;
};

const EN: Record<string, [string, string]> = {
  open1: ['First page', 'Open your first book'],
  lib10: ['Bookshelf', 'Have 10 books in your library'],
  fin1: ['The end', 'Finish your first book'],
  fin5: ['Collector', 'Finish 5 books'],
  fin12: ['One a month', 'Finish 12 books'],
  fin25: ['Devourer', 'Finish 25 books'],
  fin50: ['Walking library', 'Finish 50 books'],
  streak3: ['Spark', '3-day streak'],
  streak7: ['Week on fire', '7-day streak'],
  streak14: ['Habit', '14-day streak'],
  streak30: ['Unstoppable', '30-day streak'],
  streak100: ['Centurion', '100-day streak'],
  hour1: ['First hour', '1 hour of total reading'],
  hour10: ['Ten hours', '10 hours of total reading'],
  hour50: ['Fifty hours', '50 hours of total reading'],
  hour100: ['Hundred hours', '100 hours of total reading'],
  pages100: ['Hundred pages', 'Read 100 pages'],
  pages1000: ['Thousand pages', 'Read 1,000 pages'],
  pages5000: ['Five thousand', 'Read 5,000 pages'],
  session30: ['Immersion', 'A 30-minute session'],
  session60: ['Marathon', 'A 60-minute session'],
  goal7: ['Reliable', 'Hit your goal on 7 days'],
  goal30: ['Discipline', 'Hit your goal on 30 days'],
  quest10: ['Adventurer', 'Complete 10 quests'],
  quest50: ['Ink mercenary', 'Complete 50 quests'],
  level5: ['Level 5', 'Reach level 5'],
  level10: ['Level 10', 'Reach level 10'],
  level20: ['Level 20', 'Reach level 20'],
  owl: ['Night owl', 'Read past midnight'],
  lark: ['Early bird', 'Read before 7:00'],
  weekend: ['Weekend reader', 'Read on Saturday and Sunday in a row'],
  speed: ['Speed reader', 'Finish a book in under 7 days'],
};

const count = (id: string, title: string, desc: string, glyph: string, xp: number, target: number, metric: (c: AchievementContext) => number): Achievement => ({
  id,
  title: isEs ? title : (EN[id]?.[0] ?? title),
  desc: isEs ? desc : (EN[id]?.[1] ?? desc),
  glyph,
  xp,
  target,
  metric,
});

export const ACHIEVEMENTS: Achievement[] = [
  count('open1', 'Primera página', 'Abre tu primer libro', 'I', 50, 1, (c) => c.booksOpened),
  count('lib10', 'Estantería', 'Ten 10 libros en tu biblioteca', 'Ⅹ', 80, 10, (c) => c.librarySize),
  count('fin1', 'Fin', 'Termina tu primer libro', '∎', 300, 1, (c) => c.finished),
  count('fin5', 'Coleccionista', 'Termina 5 libros', '5', 500, 5, (c) => c.finished),
  count('fin12', 'Uno al mes', 'Termina 12 libros', '12', 900, 12, (c) => c.finished),
  count('fin25', 'Devorador', 'Termina 25 libros', '25', 1500, 25, (c) => c.finished),
  count('fin50', 'Biblioteca andante', 'Termina 50 libros', '50', 3000, 50, (c) => c.finished),
  count('streak3', 'Chispa', 'Racha de 3 días', '3d', 60, 3, (c) => c.bestStreak),
  count('streak7', 'Semana de fuego', 'Racha de 7 días', '7d', 150, 7, (c) => c.bestStreak),
  count('streak14', 'Hábito', 'Racha de 14 días', '14d', 300, 14, (c) => c.bestStreak),
  count('streak30', 'Imparable', 'Racha de 30 días', '30d', 700, 30, (c) => c.bestStreak),
  count('streak100', 'Centenario', 'Racha de 100 días', '100', 2500, 100, (c) => c.bestStreak),
  count('hour1', 'Primera hora', '1 hora de lectura total', '1h', 80, 3600, (c) => c.totalSec),
  count('hour10', 'Diez horas', '10 horas de lectura total', '10h', 300, 36000, (c) => c.totalSec),
  count('hour50', 'Cincuenta horas', '50 horas de lectura total', '50h', 1000, 180000, (c) => c.totalSec),
  count('hour100', 'Cien horas', '100 horas de lectura total', '100h', 2000, 360000, (c) => c.totalSec),
  count('pages100', 'Cien páginas', 'Avanza 100 páginas', '100p', 100, 100, (c) => c.totalPages),
  count('pages1000', 'Mil páginas', 'Avanza 1.000 páginas', '1k', 600, 1000, (c) => c.totalPages),
  count('pages5000', 'Cinco mil', 'Avanza 5.000 páginas', '5k', 2000, 5000, (c) => c.totalPages),
  count('session30', 'Inmersión', 'Una sesión de 30 minutos', '30′', 120, 1800, (c) => c.longestSession),
  count('session60', 'Maratón', 'Una sesión de 60 minutos', '60′', 250, 3600, (c) => c.longestSession),
  count('goal7', 'Cumplidor', 'Cumple tu meta 7 días', '✓7', 150, 7, (c) => c.goalsMet),
  count('goal30', 'Disciplina', 'Cumple tu meta 30 días', '✓30', 600, 30, (c) => c.goalsMet),
  count('quest10', 'Aventurero', 'Completa 10 misiones', 'Q10', 150, 10, (c) => c.questsDone),
  count('quest50', 'Mercenario de tinta', 'Completa 50 misiones', 'Q50', 600, 50, (c) => c.questsDone),
  count('level5', 'Nivel 5', 'Alcanza el nivel 5', 'L5', 100, 5, (c) => c.level),
  count('level10', 'Nivel 10', 'Alcanza el nivel 10', 'L10', 300, 10, (c) => c.level),
  count('level20', 'Nivel 20', 'Alcanza el nivel 20', 'L20', 800, 20, (c) => c.level),
  count('owl', 'Búho', 'Lee pasada la medianoche', '☾', 80, 1, (c) => (c.nightOwl ? 1 : 0)),
  count('lark', 'Alondra', 'Lee antes de las 7:00', '☼', 80, 1, (c) => (c.earlyBird ? 1 : 0)),
  count('weekend', 'Fin de semana lector', 'Lee sábado y domingo seguidos', 'S·D', 100, 1, (c) => (c.weekend ? 1 : 0)),
  count('speed', 'Velocista', 'Termina un libro en menos de 7 días', '»', 400, 1, (c) => (c.speedReader ? 1 : 0)),
];
