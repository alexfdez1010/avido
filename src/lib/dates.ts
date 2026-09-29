import { isEs, tx } from '@/i18n';

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function daySeed(key: string): number {
  return Number(key.replace(/-/g, ''));
}

const WEEKDAYS = isEs ? ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] : ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTHS = isEs
  ? ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  : ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function weekdayShort(d: Date) {
  return WEEKDAYS[d.getDay()];
}

export function monthShort(d: Date) {
  return MONTHS[d.getMonth()];
}

export function formatLongDate(d: Date = new Date()): string {
  if (!isEs) return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const long = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${long[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${m.toString().padStart(2, '0')} min`;
  if (m > 0) return `${m} min`;
  return `${s} s`;
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 6) return tx('Buenas noches, lector nocturno', 'Hello, night owl');
  if (h < 13) return tx('Buenos días', 'Good morning');
  if (h < 21) return tx('Buenas tardes', 'Good afternoon');
  return tx('Buenas noches', 'Good evening');
}
