import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/kit';
import { formatClock } from '@/lib/dates';
import type { FooterSlot, ReaderFooter as FooterPrefs } from '@/store/settings';
import type { ReaderTheme } from '@/theme/palette';
import { LOCALE, tx } from '@/i18n';

export const FOOTER_SLOTS: { id: FooterSlot; label: string }[] = [
  { id: 'none', label: tx('Nada', 'Nothing') },
  { id: 'chapterLeft', label: tx('Tiempo del capítulo', 'Chapter time left') },
  { id: 'bookLeft', label: tx('Tiempo del libro', 'Book time left') },
  { id: 'percent', label: tx('Porcentaje', 'Percentage') },
  { id: 'pages', label: tx('Páginas', 'Pages') },
  { id: 'chapter', label: tx('Capítulo', 'Chapter') },
  { id: 'clock', label: tx('Hora', 'Clock') },
  { id: 'session', label: tx('Sesión', 'Session') },
];

export type FooterInput = {
  progress: number;
  chapterLeftMin: number | null;
  bookLeftMin: number;
  page: number;
  pages: number;
  chapterTitle?: string;
  sessionSec: number;
};

export function formatMinutes(min: number): string {
  const m = Math.max(1, Math.round(min));
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}

function useClock(enabled: boolean) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setTick((n) => n + 1);
        schedule();
      }, 60000 - (Date.now() % 60000) + 50);
    };
    schedule();
    return () => clearTimeout(t);
  }, [enabled]);
  return new Date().toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

function slotText(slot: FooterSlot, v: FooterInput, clock: string): string | null {
  switch (slot) {
    case 'chapterLeft':
      return v.chapterLeftMin == null ? null : `${formatMinutes(v.chapterLeftMin)} · ${tx('capítulo', 'chapter')}`;
    case 'bookLeft':
      return `${formatMinutes(v.bookLeftMin)} · ${tx('libro', 'book')}`;
    case 'percent':
      return `${Math.floor(v.progress * 100)}%`;
    case 'pages':
      return v.pages > 0 ? `${tx('p.', 'p.')} ${v.page} / ${v.pages}` : null;
    case 'chapter':
      return v.chapterTitle ?? null;
    case 'clock':
      return clock;
    case 'session':
      return formatClock(v.sessionSec);
    default:
      return null;
  }
}

export function ReaderFooter({ prefs, input, theme, margin, bottomInset }: { prefs: FooterPrefs; input: FooterInput; theme: ReaderTheme; margin: number; bottomInset: number }) {
  const clock = useClock(prefs.left === 'clock' || prefs.right === 'clock');
  const left = slotText(prefs.left, input, clock);
  const right = slotText(prefs.right, input, clock);
  if (!left && !right && !prefs.bar) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 8, paddingBottom: Math.max(bottomInset, 8), backgroundColor: theme.bg }}>
      {(left || right) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingHorizontal: margin, paddingBottom: prefs.bar ? 6 : 0 }}>
          <Txt v="mono" color={theme.muted} numberOfLines={1} style={{ fontSize: 10.5, flexShrink: 1 }}>
            {left ?? ''}
          </Txt>
          <Txt v="mono" color={theme.muted} numberOfLines={1} style={{ fontSize: 10.5, flexShrink: 1, textAlign: 'right' }}>
            {right ?? ''}
          </Txt>
        </View>
      )}
      {prefs.bar && (
        <View style={{ height: 2, backgroundColor: theme.line }}>
          <View style={{ height: 2, width: `${Math.min(1, Math.max(0, input.progress)) * 100}%`, backgroundColor: theme.accent }} />
        </View>
      )}
    </View>
  );
}

/** Height the footer takes above the bottom inset, so paged layouts can reserve exactly that. */
export function footerHeight(prefs: FooterPrefs): number {
  const text = prefs.left !== 'none' || prefs.right !== 'none';
  if (!text && !prefs.bar) return 0;
  return 8 + (text ? 16 : 0) + (text && prefs.bar ? 6 : 0) + (prefs.bar ? 2 : 0);
}
