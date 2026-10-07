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
  volumeKeys: boolean;
  layout: ReaderLayout;
  footer: ReaderFooter;
};

export type ReaderLayout = 'scroll' | 'paged';

export type FooterSlot = 'none' | 'chapterLeft' | 'bookLeft' | 'percent' | 'pages' | 'chapter' | 'clock' | 'session';
export type ReaderFooter = { left: FooterSlot; right: FooterSlot; bar: boolean };

export const DEFAULT_FOOTER: ReaderFooter = { left: 'chapterLeft', right: 'percent', bar: true };

export function footerEmpty(f: ReaderFooter): boolean {
  return f.left === 'none' && f.right === 'none' && !f.bar;
}

export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 40;

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
  onboardStep: number;
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
      onboardStep: 0,
      name: '',
      mode: EINK ? 'light' : 'dark',
      eink: EINK,
      dailyGoalMin: 20,
      yearlyGoal: 24,
      reminders: true,
      reminderHour: 21,
      haptics: true,
      reader: { font: 'literata', size: 19, lineHeight: 1.62, margin: 24, theme: EINK ? 'eink' : 'night', justify: false, volumeKeys: false, layout: EINK ? 'paged' : 'scroll', footer: DEFAULT_FOOTER },
      set: (patch) => set(patch),
      setReader: (patch) => set((s) => ({ reader: { ...s.reader, ...patch } })),
    }),
    {
      name: 'avido.settings',
      storage: jsonStorage,
      version: 1,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        return { ...current, ...p, reader: { ...current.reader, ...p.reader, footer: { ...current.reader.footer, ...p.reader?.footer } } };
      },
    }
  )
);
