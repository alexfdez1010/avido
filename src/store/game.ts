import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ACHIEVEMENTS, type AchievementContext } from '@/game/achievements';
import { levelFromXp, levelTitle, streakMultiplier } from '@/game/levels';
import { questsForDay } from '@/game/quests';
import type { Celebration, DayLog } from '@/game/types';
import { emptyDay } from '@/game/types';
import { addDays, dayKey, parseDayKey } from '@/lib/dates';

import { useLibrary } from './library';
import { useSettings } from './settings';
import { jsonStorage } from './storage';
import { isEs, tx } from '@/i18n';

export type FinishedEntry = { id: string; title: string; at: number; days: number };

type GameState = {
  xp: number;
  days: Record<string, DayLog>;
  unlocked: Record<string, number>;
  finished: FinishedEntry[];
  freezes: number;
  bestStreak: number;
  goalsMet: number;
  questsDone: number;
  totalSec: number;
  totalPages: number;
  longestSession: number;
  flags: { nightOwl?: boolean; earlyBird?: boolean; weekend?: boolean; speedReader?: boolean };
  lastReconciled?: string;
  queue: Celebration[];
  hold: boolean;
  setHold: (hold: boolean) => void;
  reconcile: () => void;
  startSession: (bookId: string, isNew: boolean) => void;
  addReading: (sec: number, pages: number, sessionSec: number) => void;
  chapterDone: () => void;
  finishBook: (bookId: string) => void;
  dismiss: () => void;
  evaluate: () => void;
};

let cid = 0;
const celebrationId = () => `${Date.now()}-${cid++}`;

export function computeStreak(days: Record<string, DayLog>, today = new Date()): number {
  let d = today;
  const t = days[dayKey(d)];
  if (!(t?.goalMet || t?.frozen)) d = addDays(d, -1);
  let n = 0;
  for (;;) {
    const log = days[dayKey(d)];
    if (!(log?.goalMet || log?.frozen)) break;
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      const today = () => {
        const key = dayKey();
        return { key, log: get().days[key] ?? emptyDay() };
      };

      const push = (c: Omit<Celebration, 'id'>) => set((s) => ({ queue: [...s.queue, { ...c, id: celebrationId() }] }));

      const gainXp = (amount: number, dayLog: DayLog, key: string) => {
        const before = levelFromXp(get().xp);
        const xp = get().xp + amount;
        const log = { ...dayLog, xp: dayLog.xp + amount };
        set((s) => ({ xp, days: { ...s.days, [key]: log } }));
        const after = levelFromXp(xp);
        if (after > before) {
          push({ kind: 'level', title: `${tx('Nivel', 'Level')} ${after}`, subtitle: levelTitle(after), big: String(after) });
        }
        return log;
      };

      return {
        xp: 0,
        days: {},
        unlocked: {},
        finished: [],
        freezes: 1,
        bestStreak: 0,
        goalsMet: 0,
        questsDone: 0,
        totalSec: 0,
        totalPages: 0,
        longestSession: 0,
        flags: {},
        queue: [],
        hold: false,
        setHold: (hold) => set({ hold }),

        reconcile: () => {
          const s = get();
          const now = new Date();
          const key = dayKey(now);
          if (s.lastReconciled === key) return;
          const gap: string[] = [];
          let d = addDays(now, -1);
          for (let i = 0; i < 60; i++) {
            const log = s.days[dayKey(d)];
            if (log?.goalMet || log?.frozen) break;
            gap.push(dayKey(d));
            d = addDays(d, -1);
          }
          const hadStreak = gap.length < 60 && computeStreak(s.days, d) > 0;
          if (hadStreak && gap.length > 0 && gap.length <= s.freezes) {
            const days = { ...s.days };
            for (const g of gap) days[g] = { ...(days[g] ?? emptyDay()), frozen: true };
            set({ days, freezes: s.freezes - gap.length, lastReconciled: key });
            push({
              kind: 'freeze',
              title: tx('Racha salvada', 'Streak saved'),
              subtitle: isEs
                ? `Usaste ${gap.length === 1 ? 'un protector' : `${gap.length} protectores`} de racha. No te quedan muchos.`
                : `You used ${gap.length === 1 ? 'a streak freeze' : `${gap.length} streak freezes`}. Don't run out.`,
              big: '❄',
            });
          } else {
            set({ lastReconciled: key });
          }
        },

        startSession: (bookId, isNew) => {
          const { key, log } = today();
          const h = new Date().getHours();
          const next: DayLog = {
            ...log,
            sessions: log.sessions + 1,
            newBooks: log.newBooks + (isNew ? 1 : 0),
            early: log.early || h < 9,
            late: log.late || h >= 22,
          };
          const flags = { ...get().flags };
          if (h < 7 && h >= 4) flags.earlyBird = true;
          if (h < 4) flags.nightOwl = true;
          set((s) => ({ days: { ...s.days, [key]: next }, flags }));
          const lib = useLibrary.getState();
          if (isNew) lib.updateBook(bookId, { firstOpenedAt: Date.now() });
          lib.updateBook(bookId, { lastOpenedAt: Date.now() });
          get().evaluate();
        },

        addReading: (sec, pages, sessionSec) => {
          if (sec < 0 || pages < 0) return;
          const { key } = today();
          let log = today().log;
          const streakBefore = computeStreak(get().days);
          const mult = streakMultiplier(streakBefore);
          log = {
            ...log,
            sec: log.sec + sec,
            pages: log.pages + pages,
            longest: Math.max(log.longest, sessionSec),
          };
          if (sec > 0) {
            const h = String(new Date().getHours());
            log = { ...log, hours: { ...log.hours, [h]: (log.hours?.[h] ?? 0) + sec } };
          }
          set((s) => ({
            days: { ...s.days, [key]: log },
            totalSec: s.totalSec + sec,
            totalPages: s.totalPages + pages,
            longestSession: Math.max(s.longestSession, sessionSec),
          }));
          log = gainXp(Math.round(((sec / 60) * 6 + pages * 4) * mult * 10) / 10, log, key);

          const goal = useSettings.getState().dailyGoalMin;
          if (!log.goalMet && log.sec >= goal * 60) {
            log = { ...log, goalMet: true };
            set((s) => ({ days: { ...s.days, [key]: log }, goalsMet: s.goalsMet + 1 }));
            const streak = computeStreak(get().days);
            const bonus = Math.round(50 * mult);
            log = gainXp(bonus, log, key);
            const bestStreak = Math.max(get().bestStreak, streak);
            set({ bestStreak });
            push({
              kind: 'goal',
              title: tx('Meta cumplida', 'Goal reached'),
              subtitle: streak > 1 ? tx(`${streak} días seguidos. No rompas la cadena.`, `${streak} days in a row. Don't break the chain.`) : tx('Primer día de una nueva racha.', 'Day one of a new streak.'),
              big: String(streak),
              xp: bonus,
            });
            const d = new Date();
            if ((d.getDay() === 0 && get().days[dayKey(addDays(d, -1))]?.goalMet) || (d.getDay() === 6 && get().days[dayKey(addDays(d, 1))]?.goalMet)) {
              set((s) => ({ flags: { ...s.flags, weekend: true } }));
            }
            if (streak > 0 && streak % 7 === 0 && get().freezes < 3) {
              set((s) => ({ freezes: s.freezes + 1 }));
              push({ kind: 'freeze', title: tx('Protector ganado', 'Freeze earned'), subtitle: tx(`${streak} días de racha te dan un protector. Salva un día perdido.`, `${streak} days of streak earn you a freeze. It saves a missed day.`), big: '❄' });
            }
          }

          const quests = questsForDay(key, goal);
          for (const q of quests) {
            if (log.quests.includes(q.id)) continue;
            if (q.progress(log) >= q.target) {
              log = { ...log, quests: [...log.quests, q.id] };
              set((s) => ({ days: { ...s.days, [key]: log }, questsDone: s.questsDone + 1 }));
              log = gainXp(q.xp, log, key);
              push({ kind: 'quest', title: tx('Misión completada', 'Quest complete'), subtitle: q.title, xp: q.xp, big: '✦' });
              if (log.quests.length === quests.length) {
                log = gainXp(100, log, key);
                push({ kind: 'quest', title: tx('Pleno diario', 'Clean sweep'), subtitle: tx('Las tres misiones de hoy. Imbatible.', "All three of today's quests. Unstoppable."), xp: 100, big: '✦✦✦' });
              }
            }
          }
          get().evaluate();
        },

        chapterDone: () => {
          const { key, log } = today();
          set((s) => ({ days: { ...s.days, [key]: { ...log, chapters: log.chapters + 1 } } }));
          gainXp(15, get().days[key], key);
          get().addReading(0, 0, 0);
        },

        finishBook: (bookId) => {
          const lib = useLibrary.getState();
          const book = lib.books[bookId];
          if (!book || get().finished.some((f) => f.id === bookId)) return;
          const now = Date.now();
          const days = Math.max(1, Math.ceil((now - (book.firstOpenedAt ?? now)) / 86400000));
          lib.updateBook(bookId, { finishedAt: now, progress: 1, maxProgress: 1 });
          const pages = Math.round((book.totalChars ?? 0) / 1500) || book.pdfPages || 100;
          const reward = 300 + Math.min(700, Math.round(pages * 1.5));
          set((s) => ({
            finished: [...s.finished, { id: bookId, title: book.title, at: now, days }],
            flags: days < 7 ? { ...s.flags, speedReader: true } : s.flags,
          }));
          const { key, log } = today();
          gainXp(reward, log, key);
          const year = new Date().getFullYear();
          const thisYear = get().finished.filter((f) => new Date(f.at).getFullYear() === year).length;
          push({
            kind: 'finish',
            title: tx('Libro terminado', 'Book finished'),
            subtitle: `${book.title} · ${thisYear} ${tx('de', 'of')} ${useSettings.getState().yearlyGoal} ${tx('este año', 'this year')}`,
            big: String(thisYear),
            xp: reward,
          });
          get().evaluate();
        },

        dismiss: () => set((s) => ({ queue: s.queue.slice(1) })),

        evaluate: () => {
          const s = get();
          const books = Object.values(useLibrary.getState().books);
          const ctx: AchievementContext = {
            totalSec: s.totalSec,
            totalPages: s.totalPages,
            finished: s.finished.length,
            bestStreak: Math.max(s.bestStreak, computeStreak(s.days)),
            longestSession: s.longestSession,
            librarySize: books.filter((b) => !b.missing).length,
            goalsMet: s.goalsMet,
            questsDone: s.questsDone,
            level: levelFromXp(s.xp),
            booksOpened: books.filter((b) => b.firstOpenedAt).length,
            nightOwl: !!s.flags.nightOwl,
            earlyBird: !!s.flags.earlyBird,
            weekend: !!s.flags.weekend,
            speedReader: !!s.flags.speedReader,
          };
          const fresh = ACHIEVEMENTS.filter((a) => !s.unlocked[a.id] && a.metric(ctx) >= a.target);
          if (!fresh.length) return;
          const unlocked = { ...s.unlocked };
          for (const a of fresh) unlocked[a.id] = Date.now();
          set({ unlocked });
          for (const a of fresh) {
            const { key, log } = today();
            gainXp(a.xp, log, key);
            push({ kind: 'achievement', title: a.title, subtitle: a.desc, big: a.glyph, xp: a.xp });
          }
          get().evaluate();
        },
      };
    },
    {
      name: 'avido.game',
      storage: jsonStorage,
      version: 1,
      partialize: ({ queue: _q, hold: _h, ...rest }) => rest,
    }
  )
);

export function useStreak() {
  const days = useGame((s) => s.days);
  return computeStreak(days);
}

export function dayHistory(days: Record<string, DayLog>, count: number, end = new Date()) {
  const out: { key: string; date: Date; log?: DayLog }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = addDays(end, -i);
    const key = dayKey(date);
    out.push({ key, date, log: days[key] });
  }
  return out;
}

export { parseDayKey };
