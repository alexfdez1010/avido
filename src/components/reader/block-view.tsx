import { Image } from 'expo-image';
import React, { memo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import type { Block } from '@/lib/types';
import type { ReadingFont } from '@/theme/fonts';
import type { ReaderTheme } from '@/theme/palette';

export type BlockStyle = { font: ReadingFont; size: number; lineHeight: number; margin: number; justify: boolean; theme: ReaderTheme };

function Spans({ block, st, base }: { block: Block; st: BlockStyle; base: string }) {
  return (
    <>
      {block.s?.map((s, i) => (
        <Text key={i} style={s.b ? { fontFamily: st.font.bold } : s.i ? { fontFamily: st.font.italic } : { fontFamily: base }}>
          {s.t}
        </Text>
      ))}
    </>
  );
}

function Img({ src, st }: { src: string; st: BlockStyle }) {
  const { width } = useWindowDimensions();
  const [ratio, setRatio] = useState(1.4);
  const w = width - st.margin * 2;
  return (
    <View style={{ alignItems: 'center', marginVertical: 18 }}>
      <Image
        source={{ uri: src }}
        style={{ width: w, height: Math.min(w * ratio, 620), borderRadius: 4 }}
        contentFit="contain"
        onLoad={(e) => e.source.width && setRatio(e.source.height / e.source.width)}
      />
    </View>
  );
}

export const BlockView = memo(function BlockView({ block, st, first }: { block: Block; st: BlockStyle; first: boolean }) {
  const t = st.theme;
  const lh = Math.round(st.size * st.lineHeight);
  const pad = { paddingHorizontal: st.margin };
  switch (block.k) {
    case 'img':
      return block.src ? <Img src={block.src} st={st} /> : null;
    case 'hr':
      return (
        <View style={[pad, { alignItems: 'center', marginVertical: 26 }]}>
          <Text style={{ color: t.muted, letterSpacing: 12, fontFamily: st.font.regular, fontSize: 14 }}>· · ·</Text>
        </View>
      );
    case 'h1':
    case 'h2': {
      const size = block.k === 'h1' ? st.size * 1.55 : st.size * 1.3;
      return (
        <View style={[pad, { marginTop: first ? 8 : 36, marginBottom: 18 }]}>
          <Text style={{ color: t.text, fontFamily: 'Fraunces_600SemiBold', fontSize: size, lineHeight: size * 1.18, letterSpacing: -0.3 }}>
            <Spans block={block} st={{ ...st, font: { ...st.font, italic: 'Fraunces_600SemiBold_Italic', bold: 'Fraunces_900Black' } }} base="Fraunces_600SemiBold" />
          </Text>
        </View>
      );
    }
    case 'h3':
      return (
        <View style={[pad, { marginTop: first ? 4 : 24, marginBottom: 10 }]}>
          <Text style={{ color: t.text, fontFamily: st.font.bold, fontSize: st.size * 1.08, lineHeight: lh }}>
            <Spans block={block} st={st} base={st.font.bold} />
          </Text>
        </View>
      );
    case 'q':
      return (
        <View style={[pad, { marginVertical: 8 }]}>
          <View style={{ borderLeftWidth: 2, borderLeftColor: t.accent, paddingLeft: 14 }}>
            <Text style={{ color: t.text, opacity: 0.85, fontFamily: st.font.italic, fontSize: st.size * 0.96, lineHeight: lh }}>
              <Spans block={block} st={st} base={st.font.italic} />
            </Text>
          </View>
        </View>
      );
    case 'li':
      return (
        <View style={[pad, { flexDirection: 'row', marginBottom: 6 }]}>
          <Text style={{ color: t.accent, fontFamily: st.font.regular, fontSize: st.size, lineHeight: lh, width: 18 }}>•</Text>
          <Text style={{ flex: 1, color: t.text, fontFamily: st.font.regular, fontSize: st.size, lineHeight: lh }}>
            <Spans block={block} st={st} base={st.font.regular} />
          </Text>
        </View>
      );
    case 'pre':
      return (
        <View style={[pad, { marginVertical: 8 }]}>
          <Text style={{ color: t.text, fontFamily: 'JetBrainsMono_400Regular', fontSize: st.size * 0.72, lineHeight: st.size * 1.1 }}>{block.s?.map((s) => s.t).join('')}</Text>
        </View>
      );
    default:
      return (
        <View style={[pad, { marginBottom: Math.round(lh * 0.55) }]}>
          <Text style={{ color: t.text, fontFamily: st.font.regular, fontSize: st.size, lineHeight: lh, textAlign: st.justify ? 'justify' : 'left' }}>
            <Spans block={block} st={st} base={st.font.regular} />
          </Text>
        </View>
      );
  }
});
