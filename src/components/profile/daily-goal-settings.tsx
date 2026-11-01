import { CalendarDays, ChevronDown, ChevronUp, Minus, Plus, Timer } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Tap, Txt } from '@/components/kit';
import { Switch } from '@/components/ui/switch';
import { usePalette } from '@/hooks/use-palette';
import { tx } from '@/i18n';
import { dailyGoalForDate, uniformWeekGoal, type WeekGoals } from '@/lib/daily-goals';
import { scheduleReminders } from '@/lib/notifications';
import { useSettings } from '@/store/settings';

function MinuteStepper({ value, label, id, onChange }: { value: number; label: string; id: string; onChange: (value: number) => void }) {
  const p = usePalette();
  const button = { width: 48, height: 48, borderRadius: 12, backgroundColor: p.raised, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Tap testID={`${id}-minus`} accessibilityRole="button" accessibilityLabel={tx(`Reducir minutos de ${label}`, `Decrease minutes for ${label}`)} disabled={value <= 5} accessibilityState={{ disabled: value <= 5 }} feedback="select" onPress={() => onChange(Math.max(5, value - 5))} style={[button, { opacity: value <= 5 ? 0.35 : 1 }]}>
        <Minus size={16} color={p.text} />
      </Tap>
      <Txt testID={`${id}-value`} v="mono" accessibilityLabel={`${label}: ${value} min`} style={{ minWidth: 66, textAlign: 'center' }}>{value} min</Txt>
      <Tap testID={`${id}-plus`} accessibilityRole="button" accessibilityLabel={tx(`Aumentar minutos de ${label}`, `Increase minutes for ${label}`)} disabled={value >= 180} accessibilityState={{ disabled: value >= 180 }} feedback="select" onPress={() => onChange(Math.min(180, value + 5))} style={[button, { opacity: value >= 180 ? 0.35 : 1 }]}>
        <Plus size={16} color={p.text} />
      </Tap>
    </View>
  );
}

export function DailyGoalSettings() {
  const p = usePalette();
  const s = useSettings();
  const [expanded, setExpanded] = useState(false);
  const today = new Date().getDay();
  const names = [tx('Domingo', 'Sunday'), tx('Lunes', 'Monday'), tx('Martes', 'Tuesday'), tx('Miércoles', 'Wednesday'), tx('Jueves', 'Thursday'), tx('Viernes', 'Friday'), tx('Sábado', 'Saturday')];
  const update = (patch: Parameters<typeof s.set>[0]) => {
    s.set(patch);
    setTimeout(scheduleReminders, 0);
  };

  return (
    <View style={{ paddingTop: 12, paddingBottom: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 48 }}>
          <Timer size={20} color={p.ember} />
          <Txt v="label">{s.weeklyGoalsEnabled ? tx('Meta de hoy', "Today's goal") : tx('Meta diaria', 'Daily goal')}</Txt>
        </View>
        {s.weeklyGoalsEnabled ? (
          <Txt v="mono" tone="ember" testID="daily-goal-today">{dailyGoalForDate(s)} min</Txt>
        ) : (
          <MinuteStepper value={s.dailyGoalMin} label={tx('meta diaria', 'daily goal')} id="daily-goal" onChange={(dailyGoalMin) => update({ dailyGoalMin })} />
        )}
      </View>
      <Tap testID="weekly-goals-expand" accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 }}>
        <CalendarDays size={18} color={p.soft} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="caption" tone="soft">{tx('Objetivos por día', 'Goals by weekday')}</Txt>
          <Txt v="caption" tone="muted">{s.weeklyGoalsEnabled ? tx('Plan semanal activo', 'Weekly plan active') : tx('Opción avanzada', 'Advanced option')}</Txt>
        </View>
        {expanded ? <ChevronUp size={18} color={p.soft} /> : <ChevronDown size={18} color={p.soft} />}
      </Tap>
      {expanded && (
        <View testID="weekly-goals-editor" style={{ gap: 12, paddingTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Txt v="label" style={{ flex: 1 }}>{tx('Una meta para cada día', 'A goal for each day')}</Txt>
            <Switch testID="weekly-goals-toggle" accessibilityLabel={tx('Una meta para cada día', 'A goal for each day')} value={s.weeklyGoalsEnabled} onValueChange={(weeklyGoalsEnabled) => update({ weeklyGoalsEnabled, weeklyGoalMin: s.weeklyGoalMin ?? uniformWeekGoal(s.dailyGoalMin) })} trackColor={{ false: p.line, true: p.ember }} thumbColor="#fff" />
          </View>
          {s.weeklyGoalsEnabled && (
            <View style={{ gap: 4 }}>
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <View key={day} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4, minHeight: 60, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 14, backgroundColor: day === today ? p.emberSoft : 'transparent' }}>
                  <View style={{ flexShrink: 1, gap: 2 }}>
                    <Txt v="label" tone={day === today ? 'ember' : 'text'}>{names[day]}</Txt>
                    {day === today && <Txt v="caption" tone="soft">{tx('Hoy', 'Today')}</Txt>}
                  </View>
                  <MinuteStepper value={(s.weeklyGoalMin ?? uniformWeekGoal(s.dailyGoalMin))[day]} label={names[day]} id={`weekday-goal-${day}`} onChange={(value) => {
                    const weeklyGoalMin = [...(s.weeklyGoalMin ?? uniformWeekGoal(s.dailyGoalMin))] as WeekGoals;
                    weeklyGoalMin[day] = value;
                    update({ weeklyGoalMin });
                  }} />
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
