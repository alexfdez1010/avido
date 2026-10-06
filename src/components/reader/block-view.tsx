import { Image } from 'expo-image';
import React, { memo, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';

import type { Block } from '@/lib/types';
import { fonts, type ReadingFont } from '@/theme/fonts';
import type { ReaderTheme } from '@/theme/palette';

export type TextLine = { y: number; height: number };
export type OnLines = (offset: number, lines: TextLine[]) => void;

export type BlockStyle = { font: ReadingFont; size: number; lineHeight: number; margin: number; justify: boolean; theme: ReaderTheme };

const codeBg = (t: ReaderTheme) => (t.id === 'eink' ? 'transparent' : `${t.line}B3`);

function Spans({ block, st, base }: { block: Block; st: BlockStyle; base: string }) {
  return (
    <>
      {block.s?.map((s, i) =>
        s.m ? (
          <Text key={i} style={{ fontFamily: s.b ? fonts.monoBold : fonts.mono, fontSize: st.size * 0.86, backgroundColor: codeBg(st.theme) }}>
            {`\u2009${s.t}\u2009`}
          </Text>
        ) : (
          <Text key={i} style={s.b ? { fontFamily: st.font.bold } : s.i ? { fontFamily: st.font.italic } : { fontFamily: base }}>
            {s.t}
          </Text>
        )
      )}
    </>
  );
}

function Code({ block, st }: { block: Block; st: BlockStyle }) {
  const t = st.theme;
  const size = Math.max(11, Math.round(st.size * 0.8));
  return (
    <View style={{ paddingHorizontal: st.margin, marginTop: 6, marginBottom: Math.round(st.size * st.lineHeight * 0.75) }}>
      <View style={{ backgroundColor: codeBg(t), borderRadius: 8, borderWidth: t.id === 'eink' ? 1 : 0, borderColor: t.line, borderLeftWidth: 3, borderLeftColor: t.accent, overflow: 'hidden' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12 }}>
          <Text style={{ color: t.text, fontFamily: fonts.mono, fontSize: size, lineHeight: Math.round(size * 1.6), textAlign: 'left' }}>
            {block.s?.map((s, i) => (
              <Text key={i} style={s.b ? { fontFamily: fonts.monoBold } : undefined}>
                {s.t}
              </Text>
            ))}
          </Text>
        </ScrollView>
      </View>
    </View>
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

export const BlockView = memo(function BlockView({ block, st, first, onLines }: { block: Block; st: BlockStyle; first: boolean; onLines?: OnLines }) {
  const lines = (offset: number) => (onLines ? { onTextLayout: (e: { nativeEvent: { lines: TextLine[] } }) => onLines(offset, e.nativeEvent.lines) } : undefined);
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
      const top = first ? 8 : 36;
      return (
        <View style={[pad, { marginTop: top, marginBottom: 18 }]}>
          <Text {...lines(top)} style={{ color: t.text, fontFamily: 'Fraunces_600SemiBold', fontSize: size, lineHeight: size * 1.18, letterSpacing: -0.3 }}>
            <Spans block={block} st={{ ...st, font: { ...st.font, italic: 'Fraunces_600SemiBold_Italic', bold: 'Fraunces_900Black' } }} base="Fraunces_600SemiBold" />
          </Text>
        </View>
      );
    }
    case 'h3':
      return (
        <View style={[pad, { marginTop: first ? 4 : 24, marginBottom: 10 }]}>
          <Text {...lines(first ? 4 : 24)} style={{ color: t.text, fontFamily: st.font.bold, fontSize: st.size * 1.08, lineHeight: lh }}>
            <Spans block={block} st={st} base={st.font.bold} />
          </Text>
        </View>
      );
    case 'q':
      return (
        <View style={[pad, { marginVertical: 8 }]}>
          <View style={{ borderLeftWidth: 2, borderLeftColor: t.accent, paddingLeft: 14 }}>
            <Text {...lines(8)} style={{ color: t.text, opacity: 0.85, fontFamily: st.font.italic, fontSize: st.size * 0.96, lineHeight: lh }}>
              <Spans block={block} st={st} base={st.font.italic} />
            </Text>
          </View>
        </View>
      );
    case 'li':
      return (
        <View style={[pad, { flexDirection: 'row', marginBottom: 6 }]}>
          <Text style={{ color: t.accent, fontFamily: st.font.regular, fontSize: st.size, lineHeight: lh, width: 18 }}>•</Text>
          <Text {...lines(0)} style={{ flex: 1, color: t.text, fontFamily: st.font.regular, fontSize: st.size, lineHeight: lh }}>
            <Spans block={block} st={st} base={st.font.regular} />
          </Text>
        </View>
      );
    case 'pre':
      return <Code block={block} st={st} />;
    default:
      return (
        <View style={[pad, { marginBottom: Math.round(lh * 0.55) }]}>
          <Text {...lines(0)} style={{ color: t.text, fontFamily: st.font.regular, fontSize: st.size, lineHeight: lh, textAlign: st.justify ? 'justify' : 'left' }}>
            <Spans block={block} st={st} base={st.font.regular} />
          </Text>
        </View>
      );
  }
});
