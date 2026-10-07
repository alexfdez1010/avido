import type { DayLog } from '@/game/types';

import { addDays, dayKey, parseDayKey } from './dates';
import { CHARS_PER_PAGE } from './types';

export type StatsRange = 'week' | 'month' | 'year' | 'all';

/** Average characters per word (including the trailing space) used to turn pages into words. */
export const CHARS_PER_WORD = 6;
/** Fallback reading speed when there is not enough personal data yet. */
export const DEFAULT_CHARS_PER_MIN = 1100;

const MIN_SPEED_SEC = 10 * 60;

export type Bucket = { key: string; start: Date; sec: number; pages: number; days: number; current: boolean };

export type RangeStats = {
  days: number;
  activeDays: number;
  sec: number;
  pages: number;
  sessions: number;
  longest: number;
  chapters: number;
  pagesPerDay: number;
  minPerDay: number;
  /** Pages per hour of reading, or null when there is too little data. */
  pagesPerHour: number | null;
  wordsPerMin: number | null;
  buckets: Bucket[];
  monthly: boolean;
  hours: number[];
  weekdays: number[];
};

function startOfRange(range: StatsRange, days: Record<string, DayLog>, today: Date): Date {
  if (range === 'week') return addDays(today, -6);
  if (range === 'month') return addDays(today, -29);
  if (range === 'year') return new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const keys = Object.keys(days).filter((k) => (days[k]?.sec ?? 0) > 0 || (days[k]?.pages ?? 0) > 0);
  if (!keys.length) return addDays(today, -6);
  keys.sort();
  const first = parseDayKey(keys[0]);
  return first > addDays(today, -6) ? addDays(today, -6) : first;
}

function speed(sec: number, pages: number) {
  if (sec < MIN_SPEED_SEC || pages <= 0) return { pagesPerHour: null, wordsPerMin: null };
  return { pagesPerHour: pages / (sec / 3600), wordsPerMin: (pages * CHARS_PER_PAGE) / CHARS_PER_WORD / (sec / 60) };
}

export function rangeStats(daysMap: Record<string, DayLog>, range: StatsRange, today = new Date()): RangeStats {
  const from = startOfRange(range, daysMap, today);
  const todayKey = dayKey(today);
  const span = Math.round((today.getTime() - from.getTime()) / 86400000) + 1;
  const monthly = range === 'year' || (range === 'all' && span > 62);

  const buckets: Bucket[] = [];
  const byKey = new Map<string, Bucket>();
  const hours = Array.from({ length: 24 }, () => 0);
  const weekdays = Array.from({ length: 7 }, () => 0);
  let sec = 0;
  let pages = 0;
  let sessions = 0;
  let longest = 0;
  let chapters = 0;
  let activeDays = 0;

  for (let d = new Date(from), i = 0; i < span; i++, d = addDays(d, 1)) {
    const key = dayKey(d);
    const bKey = monthly ? key.slice(0, 7) : key;
    let b = byKey.get(bKey);
    if (!b) {
      b = { key: bKey, start: monthly ? new Date(d.getFullYear(), d.getMonth(), 1) : new Date(d), sec: 0, pages: 0, days: 0, current: false };
      byKey.set(bKey, b);
      buckets.push(b);
    }
    b.days++;
    if (key === todayKey) b.current = true;
    const log = daysMap[key];
    if (!log) continue;
    b.sec += log.sec;
    b.pages += log.pages;
    sec += log.sec;
    pages += log.pages;
    sessions += log.sessions;
    chapters += log.chapters;
    longest = Math.max(longest, log.longest);
    if (log.sec > 0) activeDays++;
    weekdays[(d.getDay() + 6) % 7] += log.sec;
    if (log.hours) for (const [h, s] of Object.entries(log.hours)) hours[Number(h)] += s;
  }

  return {
    days: span,
    activeDays,
    sec,
    pages,
    sessions,
    longest,
    chapters,
    pagesPerDay: pages / span,
    minPerDay: sec / 60 / span,
    ...speed(sec, pages),
    buckets,
    monthly,
    hours,
    weekdays,
  };
}

/** Same metrics for the period immediately before `range` (only for week/month). */
export function previousStats(daysMap: Record<string, DayLog>, range: StatsRange, today = new Date()): RangeStats | null {
  if (range !== 'week' && range !== 'month') return null;
  const n = range === 'week' ? 7 : 30;
  return rangeStats(daysMap, range, addDays(today, -n));
}

/** Personal reading speed in characters per minute over the last 30 days, falling back to a default. */
export function personalCharsPerMin(daysMap: Record<string, DayLog>, today = new Date()): number {
  let sec = 0;
  let pages = 0;
  for (let i = 0; i < 30; i++) {
    const log = daysMap[dayKey(addDays(today, -i))];
    if (!log) continue;
    sec += log.sec;
    pages += log.pages;
  }
  if (sec < MIN_SPEED_SEC || pages <= 0) return DEFAULT_CHARS_PER_MIN;
  const cpm = (pages * CHARS_PER_PAGE) / (sec / 60);
  return Math.min(4000, Math.max(300, cpm));
}

/** Contiguous window of `width` hours with the most reading time, or null when there is no hourly data. */
export function peakHours(hours: number[], width = 3): { from: number; to: number; share: number } | null {
  const total = hours.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let best = -1;
  let at = 0;
  for (let h = 0; h < 24; h++) {
    let s = 0;
    for (let k = 0; k < width; k++) s += hours[(h + k) % 24];
    if (s > best) {
      best = s;
      at = h;
    }
  }
  return { from: at, to: (at + width) % 24, share: best / total };
}

export function relativeChange(now: number | null, before: number | null): number | null {
  if (now == null || before == null || before <= 0) return null;
  return (now - before) / before;
}
