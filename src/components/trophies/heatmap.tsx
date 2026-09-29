import React from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/kit';
import { usePalette } from '@/hooks/use-palette';
import { addDays, dayKey, monthShort } from '@/lib/dates';
import { useGame } from '@/store/game';
import { useSettings } from '@/store/settings';
import { tx } from '@/i18n';

export function Heatmap({ weeks = 17 }: { weeks?: number }) {
  const p = usePalette();
  const days = useGame((s) => s.days);
  const goal = useSettings((s) => s.dailyGoalMin) * 60;
  const today = new Date();
  const todayKey = dayKey(today);
  const lastMonday = addDays(today, -((today.getDay() + 6) % 7));
  const start = addDays(lastMonday, -(weeks - 1) * 7);
  const cols = Array.from({ length: weeks }).map((_, w) => Array.from({ length: 7 }).map((__, d) => addDays(start, w * 7 + d)));
  const shade = (sec: number) => {
    if (sec <= 0) return p.raised;
    const r = sec / goal;
    if (r < 0.34) return 'rgba(255,91,36,0.28)';
    if (r < 0.67) return 'rgba(255,91,36,0.5)';
    if (r < 1) return 'rgba(255,91,36,0.72)';
    return p.ember;
  };
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {cols.map((col, i) => (
          <View key={i} style={{ flex: 1, gap: 4 }}>
            {col.map((d) => {
              const key = dayKey(d);
              const log = days[key];
              const future = d > today && key !== todayKey;
              return (
                <View
                  key={key}
                  style={{
                    aspectRatio: 1,
                    borderRadius: 4,
                    backgroundColor: future ? 'transparent' : log?.frozen && !log.goalMet ? 'rgba(143,211,255,0.35)' : shade(log?.sec ?? 0),
                    borderWidth: key === todayKey ? 1.5 : 0,
                    borderColor: p.text,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Txt v="mono" tone="faint" style={{ fontSize: 10 }}>
          {monthShort(start)}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt v="mono" tone="faint" style={{ fontSize: 10 }}>
            {tx('menos', 'less')}
          </Txt>
          {[0, 0.2, 0.5, 0.8, 1.2].map((r) => (
            <View key={r} style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: shade(r * goal) }} />
          ))}
          <Txt v="mono" tone="faint" style={{ fontSize: 10 }}>
            {tx('meta', 'goal')}
          </Txt>
        </View>
        <Txt v="mono" tone="faint" style={{ fontSize: 10 }}>
          {tx('hoy', 'today')}
        </Txt>
      </View>
    </View>
  );
}
