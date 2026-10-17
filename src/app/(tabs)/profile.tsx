import { Bell, BookMarked, Clock, Contrast, Download, FolderOpen, Minus, Moon, Plus, Sun, Timer, Upload, Vibrate } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, View } from 'react-native';

import { Card, PageHeader, Screen, SectionTitle, StatRow, Tap, Txt } from '@/components/kit';
import { Miga } from '@/components/mascot/miga';
import { Switch } from '@/components/ui/switch';
import { levelProgress, levelTitle } from '@/game/levels';
import { usePalette } from '@/hooks/use-palette';
import { pickFolder } from '@/lib/library';
import { scheduleReminders } from '@/lib/notifications';
import { exportProgress, importProgress, pickProgressBackup } from '@/lib/progress-transfer';
import { computeStreak, useGame } from '@/store/game';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { LOCALE, plural, tx } from '@/i18n';

function Row({ icon, title, hint, right, onPress, last, disabled, testID }: { icon: React.ReactNode; title: string; hint?: string; right?: React.ReactNode; onPress?: () => void; last?: boolean; disabled?: boolean; testID?: string }) {
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
  return onPress ? <Tap testID={testID} disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} scale={0.99} style={{ opacity: disabled ? 0.5 : 1 }}>{body}</Tap> : body;
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
  const [transferring, setTransferring] = useState(false);
  const transferError = () => Alert.alert(
    tx('No se pudo completar la copia', 'Could not complete the backup'),
    tx('Comprueba que el archivo sea una copia de Ávido válida y que haya espacio disponible. Tus datos actuales se conservan si el archivo no es válido.', 'Check that the file is a valid Ávido backup and that storage is available. Invalid files leave your current data unchanged.')
  );
  const exportBackup = async () => {
    setTransferring(true);
    try {
      if (await exportProgress()) Alert.alert(tx('Copia guardada', 'Backup saved'), tx('El archivo de progreso se ha guardado en la carpeta que has elegido.', 'The progress file was saved in your chosen folder.'));
    } catch { transferError(); } finally { setTransferring(false); }
  };
  const importBackup = async () => {
    setTransferring(true);
    try {
      const backup = await pickProgressBackup();
      if (!backup) { setTransferring(false); return; }
      const bookCount = `${backup.books.length} ${plural(backup.books.length, ['libro', 'libros'], ['book', 'books'])}`;
      Alert.alert(
        tx('¿Restaurar el progreso?', 'Restore progress?'),
        tx(
          `Copia del ${new Date(backup.exportedAt).toLocaleDateString(LOCALE)} con ${bookCount}. Reemplazará el progreso, el historial, los logros y los objetivos actuales. Los archivos de tus libros se conservan.`,
          `Backup from ${new Date(backup.exportedAt).toLocaleDateString(LOCALE)} with ${bookCount}. This replaces current progress, history, achievements and goals. Your book files are kept.`
        ),
        [
          { text: tx('Cancelar', 'Cancel'), style: 'cancel', onPress: () => setTransferring(false) },
          { text: tx('Restaurar', 'Restore'), style: 'destructive', onPress: async () => {
            try {
              await importProgress(backup);
              Alert.alert(tx('Progreso restaurado', 'Progress restored'), tx('Si faltan libros, selecciona su carpeta. Se reconocerán por su nombre y tamaño.', 'If books are missing, select their folder. Books are matched by filename and size.'));
            } catch { transferError(); } finally { setTransferring(false); }
          } },
        ],
        { cancelable: false }
      );
    } catch { transferError(); setTransferring(false); }
  };
  useFocusEffect(useCallback(() => { setActive(true); return () => setActive(false); }, []));
  const s = useSettings();
  const xp = useGame((g) => g.xp);
  const days = useGame((g) => g.days);
  const finished = useGame((g) => g.finished.length);
  const totalSec = useGame((g) => g.totalSec);
  const folderName = useLibrary((l) => l.folderName);
  const folderUri = useLibrary((l) => l.folderUri);
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

      <SectionTitle>{tx('Copia de progreso', 'Progress backup')}</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <Row testID="progress-export" disabled={transferring} icon={<Upload size={17} color={p.soft} />} title={tx('Exportar progreso', 'Export progress')} onPress={exportBackup} />
        <Row testID="progress-import" disabled={transferring} icon={<Download size={17} color={p.soft} />} title={tx('Importar progreso', 'Import progress')} onPress={importBackup} last />
      </Card>
      <Txt v="caption" tone="muted" style={{ marginTop: 10 }} accessibilityLiveRegion="polite">
        {transferring ? tx('Preparando copia…', 'Preparing backup…') : tx('Incluye posiciones, estadísticas, logros y objetivos. Guarda la copia fuera de la app; los libros no se incluyen.', 'Includes positions, statistics, achievements and goals. Save the backup outside the app; book files are not included.')}
      </Txt>

      <SectionTitle>{tx('Ajustes', 'Settings')}</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <Row icon={<FolderOpen size={17} color={p.soft} />} title={tx('Carpeta de libros', 'Books folder')} hint={folderUri?.startsWith('file:///storage/') ? tx('Selecciona de nuevo para limitar el acceso', 'Select again to limit file access') : folderName ?? tx('Sin seleccionar', 'Not selected')} onPress={pickFolder} right={<Txt v="label" tone="ember">{tx('Cambiar', 'Change')}</Txt>} />
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
            s.set({ eink: v, reader: { ...s.reader, theme: v ? 'eink' : s.reader.theme === 'eink' ? 'paper' : s.reader.theme, ...(v ? { layout: 'paged' as const } : {}) } })
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
