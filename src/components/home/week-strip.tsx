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
          <View key={key} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: lit ? p.goldSoft : log?.frozen ? p.frostSoft : 'transparent',
                borderWidth: isToday ? 1.5 : lit || log?.frozen ? 0 : 1,
                borderColor: isToday ? p.ember : future ? 'transparent' : p.line,
                borderStyle: future ? 'dashed' : 'solid',
              }}
            >
              {lit ? (
                <Flame size={19} />
              ) : log?.frozen ? (
                <Txt style={{ color: p.frost, fontSize: 15 }}>❄</Txt>
              ) : (
                <Txt v="mono" tone={future ? 'faint' : isToday ? 'text' : 'muted'}>
                  {d.getDate()}
                </Txt>
              )}
            </View>
            <Txt v="eyebrow" style={{ fontSize: 9, letterSpacing: 1 }} tone={isToday ? 'ember' : 'faint'}>
              {weekdayShort(d)}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}
