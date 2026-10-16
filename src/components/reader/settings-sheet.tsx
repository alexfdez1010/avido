import { Minus, Plus } from 'lucide-react-native';
import React from 'react';
import { Platform, View } from 'react-native';

import { Sheet, Tap, Txt } from '@/components/kit';
import { Switch } from '@/components/ui/switch';
import { FOOTER_SLOTS, ReaderFooter } from '@/components/reader/reader-footer';
import { DEFAULT_FOOTER, FONT_SIZE_MAX, FONT_SIZE_MIN, footerEmpty, useSettings, type FooterSlot, type ReaderLayout } from '@/store/settings';
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

function Segmented<T extends string>({ options, value, onChange, fg, muted, line, accent }: { options: { id: T; label: string; hint: string }[]; value: T; onChange: (v: T) => void; fg: string; muted: string; line: string; accent: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Tap
            key={o.id}
            onPress={() => onChange(o.id)}
            feedback="select"
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: on ? accent : 'transparent', backgroundColor: on ? 'transparent' : line }}
          >
            <Txt v="label" color={fg}>
              {o.label}
            </Txt>
            <Txt v="caption" color={muted}>
              {o.hint}
            </Txt>
          </Tap>
        );
      })}
    </View>
  );
}

function SlotPicker({ label, value, onChange, fg, muted, line, accent, fixedLayout }: { label: string; value: FooterSlot; onChange: (v: FooterSlot) => void; fg: string; muted: string; line: string; accent: string; fixedLayout?: boolean }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Txt v="caption" color={muted}>
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {FOOTER_SLOTS.filter((o) => !fixedLayout || (o.id !== 'chapter' && o.id !== 'chapterLeft')).map((o) => {
          const on = o.id === value;
          return (
            <Tap
              key={o.id}
              onPress={() => onChange(o.id)}
              feedback="select"
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 22, borderWidth: 2, borderColor: on ? accent : 'transparent', backgroundColor: on ? 'transparent' : line }}
            >
              <Txt v="label" color={on ? fg : muted} style={{ fontSize: 13.5 }}>
                {o.label}
              </Txt>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

const PREVIEW = { progress: 0.42, chapterLeftMin: 12, bookLeftMin: 254, page: 128, pages: 304, chapterTitle: tx('La casa del árbol', 'The tree house'), sessionSec: 1104 };

export function ReaderSettingsSheet({ open, onClose, fixedLayout = false }: { open: boolean; onClose: () => void; fixedLayout?: boolean }) {
  const r = useSettings((s) => s.reader);
  const setReader = useSettings((s) => s.setReader);
  const t = readerThemes[r.theme];
  const defaultFooter = fixedLayout ? { ...DEFAULT_FOOTER, left: 'pages' as const } : DEFAULT_FOOTER;
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  return (
    <Sheet open={open} onClose={onClose} bg={t.bg} fg={t.muted} scroll>
      <View style={{ width: '100%', paddingTop: 8 }}>
        <Txt v="eyebrow" color={t.muted}>
          {tx('Lectura', 'Reading')}
        </Txt>
        {!fixedLayout && <Segmented<ReaderLayout>
          value={r.layout}
          onChange={(layout) => setReader({ layout })}
          fg={t.text}
          muted={t.muted}
          line={t.line}
          accent={t.accent}
          options={[
            { id: 'paged', label: tx('Páginas', 'Pages'), hint: tx('Toca o desliza para pasar', 'Tap or swipe to turn') },
            { id: 'scroll', label: tx('Desplazamiento', 'Scroll'), hint: tx('Texto continuo', 'Continuous text') },
          ]}
        />}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
          <Txt v="eyebrow" color={t.muted}>
            {tx('Pie de página', 'Footer')}
          </Txt>
          <Tap
            testID="reader-footer-clear"
            onPress={() => setReader({ footer: footerEmpty(r.footer) ? defaultFooter : { left: 'none', right: 'none', bar: false } })}
            feedback="select"
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 12 }}
          >
            <Txt v="label" color={t.accent} style={{ fontSize: 13.5 }}>
              {footerEmpty(r.footer) ? tx('Restaurar', 'Restore') : tx('Vaciar', 'Clear all')}
            </Txt>
          </Tap>
        </View>
        <View style={{ marginTop: 8, height: 46, borderRadius: 16, overflow: 'hidden', backgroundColor: t.line, justifyContent: 'center' }}>
          {footerEmpty(r.footer) ? (
            <Txt v="caption" color={t.muted} style={{ textAlign: 'center' }}>
              {tx('Solo texto', 'Just the text')}
            </Txt>
          ) : (
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}>
              <ReaderFooter prefs={r.footer} input={fixedLayout ? { ...PREVIEW, chapterLeftMin: null, chapterTitle: undefined } : PREVIEW} theme={{ ...t, bg: 'transparent' }} margin={16} bottomInset={10} />
            </View>
          )}
        </View>
        <SlotPicker fixedLayout={fixedLayout} label={tx('Izquierda', 'Left')} value={r.footer.left} onChange={(left) => setReader({ footer: { ...r.footer, left } })} fg={t.text} muted={t.muted} line={t.line} accent={t.accent} />
        <SlotPicker fixedLayout={fixedLayout} label={tx('Derecha', 'Right')} value={r.footer.right} onChange={(right) => setReader({ footer: { ...r.footer, right } })} fg={t.text} muted={t.muted} line={t.line} accent={t.accent} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginTop: 6 }}>
          <Txt v="label" color={t.text}>
            {tx('Barra de progreso', 'Progress bar')}
          </Txt>
          <Switch value={r.footer.bar} onValueChange={(bar) => setReader({ footer: { ...r.footer, bar } })} trackColor={{ false: t.line, true: t.accent }} thumbColor="#fff" />
        </View>

        {!fixedLayout && <>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
          <Txt v="eyebrow" color={t.muted}>
            {tx('Tamaño de letra', 'Text size')}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Tap
            onPress={() => setReader({ size: clamp(r.size - 1, FONT_SIZE_MIN, FONT_SIZE_MAX) })}
            feedback="select"
            accessibilityLabel={tx('Reducir letra', 'Smaller text')}
            style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.line, alignItems: 'center', justifyContent: 'center' }}
          >
            <Txt style={{ fontFamily: readingFonts[r.font].regular, fontSize: 16, color: t.text }}>A</Txt>
          </Tap>
          <View style={{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' }}>
            <Txt numberOfLines={1} style={{ fontFamily: readingFonts[r.font].regular, fontSize: Math.min(r.size, 34), lineHeight: Math.min(r.size, 34) * 1.25, color: t.text }}>
              Aa
            </Txt>
            <Txt v="mono" color={t.muted} style={{ fontSize: 11 }}>
              {r.size} pt
            </Txt>
          </View>
          <Tap
            onPress={() => setReader({ size: clamp(r.size + 1, FONT_SIZE_MIN, FONT_SIZE_MAX) })}
            feedback="select"
            accessibilityLabel={tx('Aumentar letra', 'Larger text')}
            style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.line, alignItems: 'center', justifyContent: 'center' }}
          >
            <Txt style={{ fontFamily: readingFonts[r.font].regular, fontSize: 26, color: t.text }}>A</Txt>
          </Tap>
        </View>

        </>}

        <Txt v="eyebrow" color={t.muted} style={{ marginTop: 22 }}>
          {tx('Tema', 'Theme')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          {(Object.keys(readerThemes) as ReaderThemeId[]).map((id) => {
            const th = readerThemes[id];
            const on = id === r.theme;
            return (
              <Tap testID={`reader-theme-${id}`} key={id} onPress={() => setReader({ theme: id })} feedback="select" style={{ flex: 1, alignItems: 'center', gap: 6 }}>
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

        {!fixedLayout && <>
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
          {Platform.OS === 'android' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
              <Txt v="label" color={t.text}>
                {tx('Pasar página con el volumen', 'Turn pages with volume keys')}
              </Txt>
              <Switch value={r.volumeKeys} onValueChange={(v) => setReader({ volumeKeys: v })} trackColor={{ false: t.line, true: t.accent }} thumbColor="#fff" />
            </View>
          )}
        </View>
        </>}
      </View>
    </Sheet>
  );
}
