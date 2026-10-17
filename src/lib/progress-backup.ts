import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

import type { DayLog } from '@/game/types';
import type { Book } from './types';
import type { useGame } from '@/store/game';

const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const GAME_NUMBERS = ['xp', 'freezes', 'bestStreak', 'goalsMet', 'questsDone', 'totalSec', 'totalPages', 'longestSession'] as const;
const BOOK_NUMBERS = ['firstOpenedAt', 'lastOpenedAt', 'finishedAt', 'pdfPage', 'pdfPages', 'totalChars', 'readPages'] as const;
const DAY_NUMBERS = ['sec', 'pages', 'xp', 'sessions', 'longest', 'newBooks', 'chapters'] as const;
const FLAGS = ['nightOwl', 'earlyBird', 'weekend', 'speedReader'] as const;

export type BackupBook = Pick<Book, 'id' | 'fileName' | 'size' | 'format' | 'title' | 'author' | 'addedAt' | 'progress' | 'maxProgress' | 'readSeconds' | 'location' | typeof BOOK_NUMBERS[number]>;
type Game = ReturnType<typeof useGame.getState>;
export type BackupGame = Pick<Game, typeof GAME_NUMBERS[number] | 'days' | 'unlocked' | 'finished' | 'flags' | 'lastReconciled'>;
export type ProgressBackup = {
  exportedAt: number;
  books: BackupBook[];
  game: BackupGame;
  profile: { name: string; dailyGoalMin: number; yearlyGoal: number };
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid backup object');
  return value as Record<string, unknown>;
}

function number(value: unknown, max = Number.MAX_SAFE_INTEGER, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max || (integer && !Number.isInteger(value))) {
    throw new Error('Invalid backup number');
  }
  return value;
}

function text(value: unknown, max = 4096): string {
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid backup text');
  return value;
}

function id(value: unknown): string {
  const result = text(value, 128);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_~-]*$/.test(result)) throw new Error('Invalid backup ID');
  return result;
}

function dayKey(value: unknown): string {
  const key = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Number.isFinite(Date.parse(key)) || new Date(key).toISOString().slice(0, 10) !== key) {
    throw new Error('Invalid backup date');
  }
  return key;
}

function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Invalid backup boolean');
  return value;
}

function list(value: unknown, max = 100000): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error('Invalid backup list');
  return value;
}

function parseBook(value: unknown): BackupBook {
  const b = record(value);
  const format = text(b.format);
  if (!['epub', 'pdf', 'txt', 'md'].includes(format)) throw new Error('Invalid book format');
  const out: BackupBook = {
    id: id(b.id), fileName: text(b.fileName), size: number(b.size, undefined, true),
    format: format as Book['format'], title: text(b.title), addedAt: number(b.addedAt),
    progress: number(b.progress, 1), maxProgress: number(b.maxProgress, 1), readSeconds: number(b.readSeconds),
  };
  if (b.author !== undefined) out.author = text(b.author);
  for (const key of BOOK_NUMBERS) if (b[key] !== undefined) out[key] = number(b[key], undefined, key !== 'readPages');
  if (b.location !== undefined) {
    const loc = record(b.location);
    out.location = { chapter: number(loc.chapter, undefined, true), block: number(loc.block, undefined, true) };
  }
  return out;
}

function parseGame(value: unknown): BackupGame {
  const g = record(value);
  const out = { days: {}, unlocked: {}, finished: [], flags: {} } as unknown as BackupGame;
  for (const key of GAME_NUMBERS) out[key] = number(g[key]);
  for (const [key, value] of Object.entries(record(g.days))) {
    const d = record(value);
    const log = { quests: list(d.quests, 100).map(id) } as DayLog;
    for (const key of DAY_NUMBERS) log[key] = number(d[key]);
    for (const key of ['early', 'late', 'goalMet', 'frozen'] as const) if (d[key] !== undefined) log[key] = bool(d[key]);
    if (d.hours !== undefined) log.hours = Object.fromEntries(Object.entries(record(d.hours)).map(([hour, seconds]) => {
      if (!/^(?:[0-9]|1[0-9]|2[0-3])$/.test(hour)) throw new Error('Invalid reading hour');
      return [hour, number(seconds)];
    }));
    out.days[dayKey(key)] = log;
  }
  out.unlocked = Object.fromEntries(Object.entries(record(g.unlocked)).map(([key, at]) => [id(key), number(at)]));
  out.finished = list(g.finished).map((value) => {
    const f = record(value);
    return { id: id(f.id), title: text(f.title), at: number(f.at), days: number(f.days, undefined, true) };
  });
  for (const key of FLAGS) if (record(g.flags)[key] !== undefined) out.flags[key] = bool(record(g.flags)[key]);
  if (g.lastReconciled !== undefined) out.lastReconciled = dayKey(g.lastReconciled);
  return out;
}

/** Whitelist persisted data: never restore actions, local paths or permission grants. */
export function validateProgressBackup(value: unknown): ProgressBackup {
  const data = record(value);
  const p = record(data.profile);
  const books = list(data.books, 20000).map(parseBook);
  if (new Set(books.map((b) => b.id)).size !== books.length) throw new Error('Duplicate book ID');
  const dailyGoalMin = number(p.dailyGoalMin, 180, true);
  const yearlyGoal = number(p.yearlyGoal, 200, true);
  if (dailyGoalMin < 5 || yearlyGoal < 1) throw new Error('Invalid goals');
  return {
    exportedAt: number(data.exportedAt), books, game: parseGame(data.game),
    profile: { name: text(p.name, 256), dailyGoalMin, yearlyGoal },
  };
}

export async function encodeProgressBackup(data: ProgressBackup): Promise<string> {
  const payload = JSON.stringify(validateProgressBackup(data));
  const sha256 = await digestStringAsync(CryptoDigestAlgorithm.SHA256, payload);
  const result = JSON.stringify({ format: 'avido-progress', version: 1, sha256, payload }, null, 2);
  if (result.length > MAX_BACKUP_BYTES) throw new Error('Backup too large');
  return result;
}

export async function decodeProgressBackup(raw: string): Promise<ProgressBackup> {
  if (raw.length > MAX_BACKUP_BYTES) throw new Error('Backup too large');
  const envelope = record(JSON.parse(raw));
  if (envelope.format !== 'avido-progress' || envelope.version !== 1 || typeof envelope.payload !== 'string') {
    throw new Error('Unsupported backup');
  }
  const digest = await digestStringAsync(CryptoDigestAlgorithm.SHA256, envelope.payload);
  if (envelope.sha256 !== digest) throw new Error('Backup checksum mismatch');
  return validateProgressBackup(JSON.parse(envelope.payload));
}

export function backupFromState(books: Record<string, Book>, game: Game, profile: ProgressBackup['profile']): ProgressBackup {
  return validateProgressBackup({ exportedAt: Date.now(), books: Object.values(books), game, profile });
}

/** Keep local file access and IDs; attach portable progress by unique filename and size. */
export function restoreBooks(local: Record<string, Book>, saved: BackupBook[]) {
  const books: Record<string, Book> = {};
  const idMap = new Map<string, string>();
  const localByFile = new Map<string, Book[]>();
  const savedCounts = new Map<string, number>();
  for (const b of saved) {
    const key = `${b.fileName}:${b.size}`;
    savedCounts.set(key, (savedCounts.get(key) ?? 0) + 1);
  }
  for (const b of Object.values(local)) {
    const key = `${b.fileName}:${b.size}`;
    localByFile.set(key, [...(localByFile.get(key) ?? []), b]);
    books[b.id] = { ...b, firstOpenedAt: undefined, lastOpenedAt: undefined, finishedAt: undefined,
      progress: 0, maxProgress: 0, readSeconds: 0, readPages: 0, location: undefined, pdfPage: undefined };
  }
  const claimed = new Set<string>();
  for (const b of saved) {
    const key = `${b.fileName}:${b.size}`;
    const matches = (localByFile.get(key) ?? []).filter((l) => !claimed.has(l.id));
    const exact = matches.find((l) => l.id === b.id);
    const match = exact ?? (matches.length === 1 && savedCounts.get(key) === 1 ? matches[0] : undefined);
    let targetId = match?.id ?? b.id;
    while (!match && books[targetId]) targetId += '~';
    if (match) claimed.add(match.id);
    idMap.set(b.id, targetId);
    books[targetId] = match
      ? { ...books[targetId], ...b, id: targetId }
      : { ...b, id: targetId, uri: '', hue: 0, metaLoaded: false, missing: true };
  }
  return { books, idMap };
}
