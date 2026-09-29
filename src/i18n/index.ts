import { getLocales } from 'expo-localization';

export type Lang = 'es' | 'en';

function detect(): Lang {
  try {
    return getLocales()[0]?.languageCode === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

export const lang: Lang = detect();
export const isEs = lang === 'es';
export const LOCALE = isEs ? 'es-ES' : 'en-US';

export function tx(es: string, en: string): string {
  return isEs ? es : en;
}

export function plural(n: number, es: [string, string], en: [string, string]): string {
  const [one, many] = isEs ? es : en;
  return n === 1 ? one : many;
}

export function fmtNum(n: number): string {
  return n.toLocaleString(LOCALE);
}
