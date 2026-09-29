import { create } from 'zustand';
import { Platform } from 'react-native';
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

const EINK_MAKERS = /onyx|boox|bigme|meebook|boyue|likebook|mudita|minimal|daylight|ratta|supernote|moaan|xplore/i;

function detectEink(): boolean {
  if (Platform.OS !== 'android') return false;
  const c = Platform.constants as { Manufacturer?: string; Brand?: string; Model?: string };
  const id = `${c.Manufacturer ?? ''} ${c.Brand ?? ''}`;
  if (EINK_MAKERS.test(id)) return true;
  return /hisense/i.test(id) && /\bA[5-9]/i.test(c.Model ?? '');
}

const EINK = detectEink();

type SettingsState = {
  onboarded: boolean;
  name: string;
  mode: AppMode;
  eink: boolean;
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
      mode: EINK ? 'light' : 'dark',
      eink: EINK,
      dailyGoalMin: 20,
      yearlyGoal: 24,
      reminders: true,
      reminderHour: 21,
      haptics: true,
      reader: { font: 'literata', size: 19, lineHeight: 1.62, margin: 24, theme: EINK ? 'eink' : 'night', justify: false },
      set: (patch) => set(patch),
      setReader: (patch) => set((s) => ({ reader: { ...s.reader, ...patch } })),
    }),
    { name: 'avido.settings', storage: jsonStorage, version: 1 }
  )
);
