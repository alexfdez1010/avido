import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ReadingFontId } from '@/theme/fonts';
import type { AppMode, ReaderThemeId } from '@/theme/palette';

import { jsonStorage } from './storage';

export type ReaderPrefs = {
  font: ReadingFontId;
  size: number;
  lineHeight: number;
  margin: number;
  theme: ReaderThemeId;
  justify: boolean;
};

type SettingsState = {
  onboarded: boolean;
  name: string;
  mode: AppMode;
  dailyGoalMin: number;
  yearlyGoal: number;
  reminders: boolean;
  reminderHour: number;
  haptics: boolean;
  reader: ReaderPrefs;
  set: (patch: Partial<Omit<SettingsState, 'set' | 'setReader'>>) => void;
  setReader: (patch: Partial<ReaderPrefs>) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      onboarded: false,
      name: '',
      mode: 'dark',
      dailyGoalMin: 20,
      yearlyGoal: 24,
      reminders: true,
      reminderHour: 21,
      haptics: true,
      reader: { font: 'literata', size: 19, lineHeight: 1.62, margin: 24, theme: 'night', justify: false },
      set: (patch) => set(patch),
      setReader: (patch) => set((s) => ({ reader: { ...s.reader, ...patch } })),
    }),
    { name: 'avido.settings', storage: jsonStorage, version: 1 }
  )
);
