import { Check } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Bar, Card, Txt } from '@/components/kit';
import { questsForDay } from '@/game/quests';
import { emptyDay } from '@/game/types';
import { usePalette } from '@/hooks/use-palette';
import { dayKey } from '@/lib/dates';
import { useGame } from '@/store/game';
import { useSettings } from '@/store/settings';

function untilMidnight() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const m = Math.floor((end.getTime() - now.getTime()) / 60000);
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export function QuestsCard() {
  const p = usePalette();
  const key = dayKey();
  const log = useGame((s) => s.days[key]) ?? emptyDay();
  const goal = useSettings((s) => s.dailyGoalMin);
  const quests = questsForDay(key, goal);
  const done = quests.filter((q) => log.quests.includes(q.id)).length;
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Txt v="eyebrow" tone="muted">
          Misiones · {done}/{quests.length}
        </Txt>
        <Txt v="mono" tone="faint" style={{ fontSize: 10.5 }}>
          renuevan en {untilMidnight()}
        </Txt>
      </View>
      {quests.map((q, i) => {
        const complete = log.quests.includes(q.id);
        const prog = Math.min(q.target, q.progress(log));
        return (
          <View key={q.id} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: p.line, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: complete ? p.mint : 'transparent',
                borderWidth: complete ? 0 : 1.5,
                borderColor: p.faint,
              }}
            >
              {complete ? <Check size={17} color={p.bg} strokeWidth={3} /> : <Txt v="mono" tone="muted">{i + 1}</Txt>}
            </View>
            <View style={{ flex: 1, gap: 7 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt v="label" tone={complete ? 'muted' : 'text'} style={complete ? { textDecorationLine: 'line-through' } : undefined}>
                  {q.title}
                </Txt>
                <Txt v="mono" color={complete ? p.mint : p.gold}>
                  +{q.xp}
                </Txt>
              </View>
              {!complete && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Bar value={prog / q.target} color={p.gold} height={4} />
                  </View>
                  <Txt v="mono" tone="muted" style={{ fontSize: 10.5 }}>
                    {prog}/{q.target}
                  </Txt>
                </View>
              )}
            </View>
          </View>
        );
      })}
      <View style={{ marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: p.goldSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 }}>
        <Txt v="caption" color={p.gold}>
          Completa las 3 y gana un bonus
        </Txt>
        <Txt v="mono" color={p.gold}>
          +100 XP
        </Txt>
      </View>
    </Card>
  );
}
