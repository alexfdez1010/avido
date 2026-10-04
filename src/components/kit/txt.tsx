import React from 'react';
import type { TextProps, TextStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { usePalette } from '@/hooks/use-palette';
import { fonts } from '@/theme/fonts';
import type { Palette } from '@/theme/palette';

export type TxtVariant = 'hero' | 'display' | 'title' | 'headline' | 'body' | 'label' | 'caption' | 'mono' | 'number' | 'numeral' | 'eyebrow';

const VARIANTS: Record<TxtVariant, TextStyle> = {
  hero: { fontFamily: fonts.displayBlack, fontSize: 56, lineHeight: 58, letterSpacing: -1.8 },
  display: { fontFamily: fonts.displayBlack, fontSize: 38, lineHeight: 42, letterSpacing: -1.2 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, letterSpacing: -0.4 },
  headline: { fontFamily: fonts.uiBold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.uiMedium, fontSize: 14.5, lineHeight: 19 },
  caption: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 16 },
  mono: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  numeral: { fontFamily: fonts.displayBlack, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
  number: { fontFamily: fonts.monoBold, fontSize: 22, lineHeight: 26, letterSpacing: -0.5 },
  eyebrow: { fontFamily: fonts.monoBold, fontSize: 10.5, lineHeight: 14, letterSpacing: 1.4, textTransform: 'uppercase' },
};

type Tone = keyof Pick<Palette, 'text' | 'soft' | 'muted' | 'faint' | 'ember' | 'gold' | 'mint' | 'violet' | 'onEmber'>;

export type TxtProps = TextProps & { v?: TxtVariant; tone?: Tone; color?: string; italic?: boolean; center?: boolean; size?: number };

export function Txt({ v = 'body', tone = 'text', color, italic, center, size, style, ...rest }: TxtProps) {
  const p = usePalette();
  const base = VARIANTS[v];
  let fontFamily = base.fontFamily;
  if (italic && fontFamily === fonts.display) fontFamily = fonts.displayItalic;
  if (italic && fontFamily === fonts.displayBlack) fontFamily = fonts.displayBlackItalic;
  if (italic && fontFamily === fonts.displayRegular) fontFamily = fonts.displayRegularItalic;
  return (
    <Text
      {...rest}
      style={[
        base,
        { fontFamily, color: color ?? p[tone], fontWeight: undefined },
        size ? { fontSize: size, lineHeight: Math.round(size * ((base.lineHeight as number) / (base.fontSize as number))) } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}
