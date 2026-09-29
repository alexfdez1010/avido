import { Minus, Plus } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Sheet, Tap, Txt } from '@/components/kit';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/store/settings';
import { readingFonts, type ReadingFontId } from '@/theme/fonts';
import { readerThemes, type ReaderThemeId } from '@/theme/palette';
import { tx } from '@/i18n';

function Stepper({ label, value, onMinus, onPlus, fg, line }: { label: string; value: string; onMinus: () => void; onPlus: () => void; fg: string; line: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
      <Txt v="label" color={fg}>
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Tap onPress={onMinus} feedback="select" style={{ width: 42, height: 38, borderRadius: 12, backgroundColor: line, alignItems: 'center', justifyContent: 'center' }}>
          <Minus size={16} color={fg} />
        </Tap>
        <Txt v="mono" color={fg} style={{ width: 52, textAlign: 'center', fontSize: 14 }}>
          {value}
        </Txt>
        <Tap onPress={onPlus} feedback="select" style={{ width: 42, height: 38, borderRadius: 12, backgroundColor: line, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={16} color={fg} />
        </Tap>
      </View>
    </View>
  );
}

export function ReaderSettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const r = useSettings((s) => s.reader);
  const setReader = useSettings((s) => s.setReader);
  const t = readerThemes[r.theme];
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  return (
    <Sheet open={open} onClose={onClose} bg={t.bg} fg={t.muted}>
      <View style={{ width: '100%', paddingTop: 8 }}>
        <Txt v="eyebrow" color={t.muted}>
          {tx('Tema', 'Theme')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          {(Object.keys(readerThemes) as ReaderThemeId[]).map((id) => {
            const th = readerThemes[id];
            const on = id === r.theme;
            return (
              <Tap key={id} onPress={() => setReader({ theme: id })} feedback="select" style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <View style={{ width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: th.bg, borderWidth: 2, borderColor: on ? th.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  <Txt style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: th.text }}>Aa</Txt>
                </View>
                <Txt v="caption" color={on ? t.text : t.muted}>
                  {th.label}
                </Txt>
              </Tap>
            );
          })}
        </View>

        <Txt v="eyebrow" color={t.muted} style={{ marginTop: 22 }}>
          {tx('Tipografía', 'Typeface')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {(Object.keys(readingFonts) as ReadingFontId[]).map((id) => {
            const f = readingFonts[id];
            const on = id === r.font;
            return (
              <Tap
                key={id}
                onPress={() => setReader({ font: id })}
                feedback="select"
                style={{ width: '48.5%', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: on ? t.accent : 'transparent', backgroundColor: on ? 'transparent' : t.line }}
              >
                <Txt style={{ fontFamily: f.regular, fontSize: 19, color: t.text }}>{f.label}</Txt>
                <Txt v="caption" color={t.muted}>
                  {f.hint}
                </Txt>
              </Tap>
            );
          })}
        </View>

        <View style={{ marginTop: 14 }}>
          <Stepper label={tx('Tamaño', 'Size')} value={`${r.size}`} fg={t.text} line={t.line} onMinus={() => setReader({ size: clamp(r.size - 1, 14, 30) })} onPlus={() => setReader({ size: clamp(r.size + 1, 14, 30) })} />
          <Stepper
            label={tx('Interlineado', 'Line height')}
            value={r.lineHeight.toFixed(2)}
            fg={t.text}
            line={t.line}
            onMinus={() => setReader({ lineHeight: Math.round(clamp(r.lineHeight - 0.08, 1.2, 2.2) * 100) / 100 })}
            onPlus={() => setReader({ lineHeight: Math.round(clamp(r.lineHeight + 0.08, 1.2, 2.2) * 100) / 100 })}
          />
          <Stepper label={tx('Márgenes', 'Margins')} value={`${r.margin}`} fg={t.text} line={t.line} onMinus={() => setReader({ margin: clamp(r.margin - 4, 12, 48) })} onPlus={() => setReader({ margin: clamp(r.margin + 4, 12, 48) })} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
            <Txt v="label" color={t.text}>
              {tx('Justificar texto', 'Justify text')}
            </Txt>
            <Switch value={r.justify} onValueChange={(v) => setReader({ justify: v })} trackColor={{ false: t.line, true: t.accent }} thumbColor="#fff" />
          </View>
        </View>
      </View>
    </Sheet>
  );
}
