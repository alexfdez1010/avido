import { Bell, BookMarked, Clock, Contrast, FolderOpen, Minus, Moon, Plus, Sun, Timer, Vibrate } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { View } from 'react-native';

import { Card, PageHeader, Screen, SectionTitle, StatRow, Tap, Txt } from '@/components/kit';
import { Miga } from '@/components/mascot/miga';
import { Switch } from '@/components/ui/switch';
import { levelProgress, levelTitle } from '@/game/levels';
import { usePalette } from '@/hooks/use-palette';
import { pickFolder } from '@/lib/library';
import { scheduleReminders } from '@/lib/notifications';
import { computeStreak, useGame } from '@/store/game';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { tx } from '@/i18n';

function Row({ icon, title, hint, right, onPress, last }: { icon: React.ReactNode; title: string; hint?: string; right?: React.ReactNode; onPress?: () => void; last?: boolean }) {
  const p = usePalette();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: p.ink ? p.faint : p.line }}>
      <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Txt v="label">{title}</Txt>
        {!!hint && (
          <Txt v="caption" tone="muted" numberOfLines={1}>
            {hint}
          </Txt>
        )}
      </View>
      {right}
    </View>
  );
  return onPress ? <Tap onPress={onPress} scale={0.99}>{body}</Tap> : body;
}

function Stepper({ value, unit, onChange, step, min, max }: { value: number; unit: string; onChange: (v: number) => void; step: number; min: number; max: number }) {
  const p = usePalette();
  const btn = { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: p.ink ? p.text : p.line, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Tap feedback="select" onPress={() => onChange(Math.max(min, value - step))} style={btn}>
        <Minus size={15} color={p.soft} />
      </Tap>
      <Txt v="mono" style={{ minWidth: 52, textAlign: 'center', fontSize: 13 }}>
        {value}
        {unit}
      </Txt>
      <Tap feedback="select" onPress={() => onChange(Math.min(max, value + step))} style={btn}>
        <Plus size={15} color={p.soft} />
      </Tap>
    </View>
  );
}

export default function Profile() {
  const p = usePalette();
  const [active, setActive] = useState(false);
  useFocusEffect(useCallback(() => { setActive(true); return () => setActive(false); }, []));
  const s = useSettings();
  const xp = useGame((g) => g.xp);
  const days = useGame((g) => g.days);
  const finished = useGame((g) => g.finished.length);
  const totalSec = useGame((g) => g.totalSec);
  const folderName = useLibrary((l) => l.folderName);
  const lp = levelProgress(xp);
  const streak = computeStreak(days);
  const activeDays = Object.values(days).filter((d) => d.sec > 0).length;
  const sw = (v: boolean, on: (v: boolean) => void) => <Switch value={v} onValueChange={on} trackColor={{ false: p.line, true: p.ember }} thumbColor="#fff" />;

  return (
    <Screen>
      <PageHeader
        eyebrow={`${tx('Nv', 'Lv')} ${lp.level} · ${levelTitle(lp.level)}`}
        title={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Txt v="display" numberOfLines={1} adjustsFontSizeToFit style={{ flex: 1 }}>
              {s.name || tx('Lector', 'Reader')}
            </Txt>
            <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: p.emberSoft, alignItems: 'center', justifyContent: 'center', marginTop: -24 }}>
              <Miga size={84} active={active} interactive />
            </View>
          </View>
        }
      />

      <View style={{ marginTop: 20 }}>
        <StatRow
          items={[
            { label: tx('Libros', 'Books'), value: `${finished}` },
            { label: tx('Racha', 'Streak'), value: `${streak}` },
            { label: tx('Días', 'Days'), value: `${activeDays}` },
            { label: tx('Horas', 'Hours'), value: `${Math.floor(totalSec / 3600)}` },
          ]}
        />
      </View>

      <SectionTitle>{tx('Retos', 'Challenges')}</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <Row icon={<Timer size={17} color={p.ember} />} title={tx('Meta diaria', 'Daily goal')} right={<Stepper value={s.dailyGoalMin} unit="′" step={5} min={5} max={180} onChange={(v) => s.set({ dailyGoalMin: v })} />} />
        <Row icon={<BookMarked size={17} color={p.gold} />} title={tx('Libros este año', 'Books this year')} last right={<Stepper value={s.yearlyGoal} unit="" step={1} min={1} max={200} onChange={(v) => s.set({ yearlyGoal: v })} />} />
      </Card>

      <SectionTitle>{tx('Ajustes', 'Settings')}</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <Row icon={<FolderOpen size={17} color={p.soft} />} title={tx('Carpeta de libros', 'Books folder')} hint={folderName ?? tx('Sin seleccionar', 'Not selected')} onPress={pickFolder} right={<Txt v="label" tone="ember">{tx('Cambiar', 'Change')}</Txt>} />
        <Row
          icon={<Bell size={17} color={p.soft} />}
          title={tx('Recordatorios', 'Reminders')}
          right={sw(s.reminders, (v) => {
            s.set({ reminders: v });
            setTimeout(scheduleReminders, 0);
          })}
        />
        {s.reminders && (
          <Row
            icon={<Clock size={17} color={p.soft} />}
            title={tx('Hora del aviso', 'Reminder time')}
            right={
              <Stepper
                value={s.reminderHour}
                unit=":00"
                step={1}
                min={6}
                max={23}
                onChange={(v) => {
                  s.set({ reminderHour: v });
                  setTimeout(scheduleReminders, 0);
                }}
              />
            }
          />
        )}
        <Row icon={<Vibrate size={17} color={p.soft} />} title={tx('Vibración', 'Vibration')} right={sw(s.haptics, (v) => s.set({ haptics: v }))} />
        <Row
          icon={<Contrast size={17} color={p.soft} />}
          title={tx('Tinta electrónica', 'E-ink screen')}
          last={s.eink}
          right={sw(s.eink, (v) =>
            s.set({ eink: v, reader: { ...s.reader, theme: v ? 'eink' : s.reader.theme === 'eink' ? 'paper' : s.reader.theme } })
          )}
        />
        {!s.eink && (
          <Row
            icon={s.mode === 'dark' ? <Moon size={17} color={p.soft} /> : <Sun size={17} color={p.soft} />}
            title={tx('Tema oscuro', 'Dark mode')}
            last
            right={sw(s.mode === 'dark', (v) => s.set({ mode: v ? 'dark' : 'light' }))}
          />
        )}
      </Card>
    </Screen>
  );
}
