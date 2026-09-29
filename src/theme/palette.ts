import { tx } from '@/i18n';

export type AppMode = 'dark' | 'light';
export type Palette = {
  mode: AppMode;
  bg: string;
  surface: string;
  raised: string;
  line: string;
  text: string;
  soft: string;
  muted: string;
  faint: string;
  ember: string;
  emberSoft: string;
  gold: string;
  goldSoft: string;
  mint: string;
  mintSoft: string;
  violet: string;
  onEmber: string;
  scrim: string;
};

export const palettes: Record<AppMode, Palette> = {
  dark: {
    mode: 'dark',
    bg: '#100E0B',
    surface: '#1A1713',
    raised: '#24201B',
    line: '#2C2822',
    text: '#F3EDE2',
    soft: '#CFC7B9',
    muted: '#8C8476',
    faint: '#57514A',
    ember: '#FF5B24',
    emberSoft: 'rgba(255,91,36,0.14)',
    gold: '#F2B544',
    goldSoft: 'rgba(242,181,68,0.14)',
    mint: '#7FD6AE',
    mintSoft: 'rgba(127,214,174,0.14)',
    violet: '#A99BFF',
    onEmber: '#FFF8F0',
    scrim: 'rgba(8,7,5,0.72)',
  },
  light: {
    mode: 'light',
    bg: '#F4EFE6',
    surface: '#FBF8F2',
    raised: '#EAE3D6',
    line: '#DED6C7',
    text: '#1B1916',
    soft: '#4A443C',
    muted: '#807769',
    faint: '#B5AC9C',
    ember: '#F04E17',
    emberSoft: 'rgba(240,78,23,0.10)',
    gold: '#C98A12',
    goldSoft: 'rgba(201,138,18,0.12)',
    mint: '#2E9C6C',
    mintSoft: 'rgba(46,156,108,0.12)',
    violet: '#6A58E0',
    onEmber: '#FFF8F0',
    scrim: 'rgba(27,25,22,0.45)',
  },
};

export type ReaderThemeId = 'paper' | 'sepia' | 'dusk' | 'night' | 'oled';

export type ReaderTheme = {
  id: ReaderThemeId;
  label: string;
  bg: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  statusBar: 'light' | 'dark';
};

export const readerThemes: Record<ReaderThemeId, ReaderTheme> = {
  paper: { id: 'paper', label: tx('Papel', 'Paper'), bg: '#F7F3EA', text: '#1F1C18', muted: '#8B8274', line: '#E4DCCD', accent: '#F04E17', statusBar: 'dark' },
  sepia: { id: 'sepia', label: 'Sepia', bg: '#EFE2C8', text: '#3A2E20', muted: '#8F7B5E', line: '#DCCBA9', accent: '#C4531D', statusBar: 'dark' },
  dusk: { id: 'dusk', label: tx('Ocaso', 'Dusk'), bg: '#2A2521', text: '#E6DDCF', muted: '#968A7A', line: '#3B342E', accent: '#FF7A45', statusBar: 'light' },
  night: { id: 'night', label: tx('Noche', 'Night'), bg: '#14120F', text: '#CFC6B8', muted: '#77705F', line: '#26221D', accent: '#FF5B24', statusBar: 'light' },
  oled: { id: 'oled', label: tx('Tinta', 'Ink'), bg: '#000000', text: '#B9B2A6', muted: '#5F5A52', line: '#1A1815', accent: '#FF5B24', statusBar: 'light' },
};
