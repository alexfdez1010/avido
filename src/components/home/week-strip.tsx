import React from 'react';
import { View } from 'react-native';

import { Flame, Txt } from '@/components/kit';
import { usePalette } from '@/hooks/use-palette';
import { addDays, dayKey, weekdayShort } from '@/lib/dates';
import { useGame } from '@/store/game';

export function WeekStrip() {
  const p = usePalette();
  const days = useGame((s) => s.days);
  const today = new Date();
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(monday, i);
        const key = dayKey(d);
        const log = days[key];
        const isToday = key === dayKey(today);
        const future = d > today && !isToday;
        const lit = log?.goalMet;
        return (
          <View key={key} style={{ alignItems: 'center', gap: 6 }}>
            <Txt v="eyebrow" style={{ fontSize: 9.5 }} tone={isToday ? 'text' : 'muted'}>
              {weekdayShort(d)}
            </Txt>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: lit ? p.goldSoft : log?.frozen ? 'rgba(143,211,255,0.14)' : future ? 'transparent' : p.surface,
                borderWidth: isToday ? 1.5 : 0,
                borderColor: p.ember,
              }}
            >
              {lit ? (
                <Flame size={20} />
              ) : log?.frozen ? (
                <Txt style={{ color: '#8FD3FF', fontSize: 16 }}>❄</Txt>
              ) : (
                <Txt v="mono" tone={future ? 'faint' : 'muted'}>
                  {d.getDate()}
                </Txt>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
