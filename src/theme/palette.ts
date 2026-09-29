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
  ink: boolean;
  frost: string;
  frostSoft: string;
  heat: [string, string, string];
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
    ember: '#3DD68C',
    emberSoft: 'rgba(61,214,140,0.13)',
    gold: '#F2B544',
    goldSoft: 'rgba(242,181,68,0.14)',
    mint: '#3DD68C',
    mintSoft: 'rgba(61,214,140,0.13)',
    violet: '#A99BFF',
    onEmber: '#06140C',
    scrim: 'rgba(8,7,5,0.72)',
    ink: false,
    frost: '#8FD3FF',
    frostSoft: 'rgba(143,211,255,0.14)',
    heat: ['rgba(61,214,140,0.25)', 'rgba(61,214,140,0.48)', 'rgba(61,214,140,0.72)'],
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
    ember: '#1C8A52',
    emberSoft: 'rgba(28,138,82,0.10)',
    gold: '#C98A12',
    goldSoft: 'rgba(201,138,18,0.12)',
    mint: '#1C8A52',
    mintSoft: 'rgba(28,138,82,0.10)',
    violet: '#6A58E0',
    onEmber: '#F4FFF8',
    scrim: 'rgba(27,25,22,0.45)',
    ink: false,
    frost: '#2E86C1',
    frostSoft: 'rgba(46,134,193,0.12)',
    heat: ['rgba(28,138,82,0.22)', 'rgba(28,138,82,0.45)', 'rgba(28,138,82,0.7)'],
  },
};

export const einkPalette: Palette = {
  mode: 'light',
  bg: '#FFFFFF',
  surface: '#EDEDED',
  raised: '#D4D4D4',
  line: '#B0B0B0',
  text: '#000000',
  soft: '#1E1E1E',
  muted: '#3C3C3C',
  faint: '#707070',
  ember: '#000000',
  emberSoft: '#D4D4D4',
  gold: '#000000',
  goldSoft: '#D4D4D4',
  mint: '#000000',
  mintSoft: '#D4D4D4',
  violet: '#000000',
  onEmber: '#FFFFFF',
  scrim: 'rgba(255,255,255,0.8)',
  ink: true,
  frost: '#000000',
  frostSoft: '#D4D4D4',
  heat: ['#C8C8C8', '#8C8C8C', '#4A4A4A'],
};

export type ReaderThemeId = 'paper' | 'sepia' | 'dusk' | 'night' | 'oled' | 'eink';

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
  paper: { id: 'paper', label: tx('Papel', 'Paper'), bg: '#F7F3EA', text: '#1F1C18', muted: '#8B8274', line: '#E4DCCD', accent: '#1C8A52', statusBar: 'dark' },
  sepia: { id: 'sepia', label: 'Sepia', bg: '#EFE2C8', text: '#3A2E20', muted: '#8F7B5E', line: '#DCCBA9', accent: '#4E7A3A', statusBar: 'dark' },
  dusk: { id: 'dusk', label: tx('Ocaso', 'Dusk'), bg: '#2A2521', text: '#E6DDCF', muted: '#968A7A', line: '#3B342E', accent: '#6FD39B', statusBar: 'light' },
  night: { id: 'night', label: tx('Noche', 'Night'), bg: '#14120F', text: '#CFC6B8', muted: '#77705F', line: '#26221D', accent: '#3DD68C', statusBar: 'light' },
  eink: { id: 'eink', label: 'E-ink', bg: '#FFFFFF', text: '#000000', muted: '#333333', line: '#BDBDBD', accent: '#000000', statusBar: 'dark' },
  oled: { id: 'oled', label: tx('Tinta', 'Ink'), bg: '#000000', text: '#B9B2A6', muted: '#5F5A52', line: '#1A1815', accent: '#2FBF78', statusBar: 'light' },
};
