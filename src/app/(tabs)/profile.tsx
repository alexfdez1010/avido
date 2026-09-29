import { Bell, FolderOpen, Minus, Moon, Plus, Sun, Vibrate } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Card, Screen, SectionTitle, Tap, Txt } from '@/components/kit';
import { Switch } from '@/components/ui/switch';
import { levelProgress, levelTitle } from '@/game/levels';
import { usePalette } from '@/hooks/use-palette';
import { formatDuration } from '@/lib/dates';
import { pickFolder } from '@/lib/library';
import { scheduleReminders } from '@/lib/notifications';
import { computeStreak, useGame } from '@/store/game';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { fonts } from '@/theme/fonts';

function Row({ icon, title, hint, right, onPress, last }: { icon: React.ReactNode; title: string; hint?: string; right?: React.ReactNode; onPress?: () => void; last?: boolean }) {
  const p = usePalette();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: p.line }}>
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: p.raised, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
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
  const btn = { width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderColor: p.line, alignItems: 'center' as const, justifyContent: 'center' as const };
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
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: p.emberSoft, borderWidth: 2, borderColor: p.ember, alignItems: 'center', justifyContent: 'center' }}>
          <Txt style={{ fontFamily: fonts.displayBlackItalic, fontSize: 44, lineHeight: 52, color: p.ember }}>{(s.name || 'L').slice(0, 1).toUpperCase()}</Txt>
        </View>
        <Txt v="display" style={{ marginTop: 14 }}>
          {s.name || 'Lector'}
        </Txt>
        <Txt v="mono" tone="muted" style={{ marginTop: 4 }}>
          Nv {lp.level} · {levelTitle(lp.level)}
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
        {[
          { k: 'Libros', v: `${finished}` },
          { k: 'Racha', v: `${streak}` },
          { k: 'Días', v: `${activeDays}` },
          { k: 'Horas', v: `${Math.floor(totalSec / 3600)}` },
        ].map((x) => (
          <View key={x.k} style={{ flex: 1, backgroundColor: p.surface, borderRadius: 18, borderWidth: 1, borderColor: p.line, paddingVertical: 14, alignItems: 'center' }}>
            <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 26, lineHeight: 30, color: p.text }}>{x.v}</Txt>
            <Txt v="eyebrow" tone="muted" style={{ fontSize: 9, marginTop: 2 }}>
              {x.k}
            </Txt>
          </View>
        ))}
      </View>
      <Txt v="caption" tone="faint" center style={{ marginTop: 10 }}>
        {formatDuration(totalSec)} leyendo con Ávido
      </Txt>

      <SectionTitle>
        <Txt v="eyebrow" tone="muted">
          Retos
        </Txt>
      </SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <Row icon={<Txt style={{ fontFamily: fonts.monoBold, color: p.ember }}>′</Txt>} title="Meta diaria" hint="Mantiene viva la racha" right={<Stepper value={s.dailyGoalMin} unit="′" step={5} min={5} max={180} onChange={(v) => s.set({ dailyGoalMin: v })} />} />
        <Row icon={<Txt style={{ fontFamily: fonts.monoBold, color: p.gold }}>#</Txt>} title="Libros este año" hint="Tu reto anual" last right={<Stepper value={s.yearlyGoal} unit="" step={1} min={1} max={200} onChange={(v) => s.set({ yearlyGoal: v })} />} />
      </Card>

      <SectionTitle>
        <Txt v="eyebrow" tone="muted">
          Ajustes
        </Txt>
      </SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <Row icon={<FolderOpen size={17} color={p.soft} />} title="Carpeta de libros" hint={folderName ?? 'Sin seleccionar'} onPress={pickFolder} right={<Txt v="label" tone="ember">Cambiar</Txt>} />
        <Row
          icon={<Bell size={17} color={p.soft} />}
          title="Recordatorios"
          hint={s.reminders ? `Cada día a las ${s.reminderHour}:00` : 'Desactivados'}
          right={sw(s.reminders, (v) => {
            s.set({ reminders: v });
            setTimeout(scheduleReminders, 0);
          })}
        />
        {s.reminders && (
          <Row
            icon={<Txt style={{ fontFamily: fonts.monoBold, color: p.soft }}>h</Txt>}
            title="Hora del aviso"
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
        <Row icon={<Vibrate size={17} color={p.soft} />} title="Vibración" hint="Respuesta háptica" right={sw(s.haptics, (v) => s.set({ haptics: v }))} />
        <Row
          icon={s.mode === 'dark' ? <Moon size={17} color={p.soft} /> : <Sun size={17} color={p.soft} />}
          title="Tema oscuro"
          hint="Interfaz de la app"
          last
          right={sw(s.mode === 'dark', (v) => s.set({ mode: v ? 'dark' : 'light' }))}
        />
      </Card>
      <Txt v="mono" tone="faint" center style={{ marginTop: 26 }}>
        Ávido · lee con hambre
      </Txt>
    </Screen>
  );
}
