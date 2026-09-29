import { tx } from '@/i18n';

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  displayBlack: 'Fraunces_900Black',
  displayBlackItalic: 'Fraunces_900Black_Italic',
  displayRegular: 'Fraunces_400Regular',
  displayRegularItalic: 'Fraunces_400Regular_Italic',
  ui: 'BricolageGrotesque_400Regular',
  uiMedium: 'BricolageGrotesque_500Medium',
  uiBold: 'BricolageGrotesque_700Bold',
  uiHeavy: 'BricolageGrotesque_800ExtraBold',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_600SemiBold',
} as const;

export type ReadingFontId = 'literata' | 'newsreader' | 'fraunces' | 'atkinson';

export type ReadingFont = {
  id: ReadingFontId;
  label: string;
  regular: string;
  italic: string;
  bold: string;
  hint: string;
};

export const readingFonts: Record<ReadingFontId, ReadingFont> = {
  literata: {
    id: 'literata',
    label: 'Literata',
    regular: 'Literata_400Regular',
    italic: 'Literata_400Regular_Italic',
    bold: 'Literata_700Bold',
    hint: tx('Clásica y serena', 'Classic and calm'),
  },
  newsreader: {
    id: 'newsreader',
    label: 'Newsreader',
    regular: 'Newsreader_400Regular',
    italic: 'Newsreader_400Regular_Italic',
    bold: 'Newsreader_700Bold',
    hint: tx('Editorial, compacta', 'Editorial, compact'),
  },
  fraunces: {
    id: 'fraunces',
    label: 'Fraunces',
    regular: 'Fraunces_400Regular',
    italic: 'Fraunces_400Regular_Italic',
    bold: 'Fraunces_700Bold',
    hint: tx('Con carácter', 'Full of character'),
  },
  atkinson: {
    id: 'atkinson',
    label: 'Atkinson',
    regular: 'AtkinsonHyperlegible_400Regular',
    italic: 'AtkinsonHyperlegible_400Regular_Italic',
    bold: 'AtkinsonHyperlegible_700Bold',
    hint: tx('Máxima legibilidad', 'Maximum legibility'),
  },
};
