export const LEVEL_TITLES = [
  'Curioso',
  'Hojeador',
  'Aprendiz de tinta',
  'Lector constante',
  'Devoralibros',
  'Ratón de biblioteca',
  'Bibliófilo',
  'Erudito',
  'Sabio de papel',
  'Guardián del canon',
  'Leyenda de tinta',
];

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(80 * Math.pow(level - 1, 1.7));
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 3))];
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - floor, needed: next - floor, ratio: (xp - floor) / (next - floor), toNext: next - xp };
}

export function streakMultiplier(streak: number): number {
  return 1 + Math.min(streak, 25) * 0.02;
}
