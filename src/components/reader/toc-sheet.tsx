import React from 'react';
import { View } from 'react-native';

import { Sheet, Tap, Txt } from '@/components/kit';
import type { Chapter } from '@/lib/types';
import type { ReaderTheme } from '@/theme/palette';
import { tx } from '@/i18n';

export function TocSheet({ open, onClose, chapters, current, theme, onPick }: { open: boolean; onClose: () => void; chapters: Chapter[]; current: number; theme: ReaderTheme; onPick: (i: number) => void }) {
  return (
    <Sheet open={open} onClose={onClose} bg={theme.bg} fg={theme.muted} scroll maxHeight="80%">
      <Txt v="eyebrow" color={theme.muted} style={{ marginTop: 8, marginBottom: 8 }}>
        {tx('Índice', 'Contents')} · {chapters.length} {tx('capítulos', 'chapters')}
      </Txt>
      {chapters.map((c, i) => {
        const on = i === current;
        return (
          <Tap key={i} feedback="select" onPress={() => onPick(i)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 14, borderBottomWidth: 1, borderBottomColor: theme.line }}>
            <Txt v="mono" color={on ? theme.accent : theme.muted} style={{ width: 28 }}>
              {String(i + 1).padStart(2, '0')}
            </Txt>
            <View style={{ flex: 1 }}>
              <Txt v="label" color={on ? theme.accent : theme.text} numberOfLines={2} style={{ fontSize: 15 }}>
                {c.title}
              </Txt>
            </View>
            <Txt v="caption" color={theme.muted}>
              {Math.max(1, Math.round(c.chars / 1500))} {tx('pág', 'pp')}
            </Txt>
          </Tap>
        );
      })}
    </Sheet>
  );
}
