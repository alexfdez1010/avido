import { Check } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Bar, Card, Divider, Txt } from '@/components/kit';
import { questsForDay } from '@/game/quests';
import { emptyDay } from '@/game/types';
import { usePalette } from '@/hooks/use-palette';
import { dayKey } from '@/lib/dates';
import { useGame } from '@/store/game';
import { useSettings } from '@/store/settings';

export function useQuestSummary() {
  const key = dayKey();
  const log = useGame((s) => s.days[key]) ?? emptyDay();
  const goal = useSettings((s) => s.dailyGoalMin);
  const quests = questsForDay(key, goal);
  const done = quests.filter((q) => log.quests.includes(q.id)).length;
  return { quests, log, done };
}

export function QuestsCard() {
  const p = usePalette();
  const { quests, log } = useQuestSummary();
  return (
    <Card style={{ paddingVertical: 4 }}>
      {quests.map((q, i) => {
        const complete = log.quests.includes(q.id);
        const prog = Math.min(q.target, q.progress(log));
        return (
          <View key={q.id}>
            {i > 0 && <Divider inset={46} />}
            <View style={{ paddingVertical: 14, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: complete ? p.mint : 'transparent',
                  borderWidth: complete ? 0 : 1.5,
                  borderColor: p.line,
                }}
              >
                {complete ? (
                  <Check size={17} color={p.bg} strokeWidth={3} />
                ) : (
                  <Txt v="mono" tone="muted">
                    {i + 1}
                  </Txt>
                )}
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <Txt v="label" tone={complete ? 'muted' : 'text'} style={[{ flex: 1 }, complete ? { textDecorationLine: 'line-through' } : null]}>
                    {q.title}
                  </Txt>
                  <Txt v="mono" color={complete ? p.mint : p.gold}>
                    +{q.xp} XP
                  </Txt>
                </View>
                {!complete && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Bar value={prog / q.target} color={p.gold} height={4} />
                    </View>
                    <Txt v="mono" tone="muted" style={{ fontSize: 10.5, minWidth: 36, textAlign: 'right' }}>
                      {prog}/{q.target}
                    </Txt>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </Card>
  );
}
