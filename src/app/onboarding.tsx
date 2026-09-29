import { router } from 'expo-router';
import { FolderOpen } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cta, Flame, Tap, Txt } from '@/components/kit';
import { Input, InputField } from '@/components/ui/input';
import { usePalette } from '@/hooks/use-palette';
import { pickFolder } from '@/lib/library';
import { ensurePermission, scheduleReminders } from '@/lib/notifications';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { fonts } from '@/theme/fonts';
import { tx } from '@/i18n';

const GOALS = [
  { min: 10, label: tx('Tranquilo', 'Easy'), hint: tx('Un hábito que no falla', 'A habit that never fails') },
  { min: 20, label: tx('Constante', 'Steady'), hint: tx('El punto dulce', 'The sweet spot') },
  { min: 30, label: tx('Ambicioso', 'Ambitious'), hint: tx('~20 libros al año', '~20 books a year') },
  { min: 60, label: tx('Voraz', 'Voracious'), hint: tx('Sin piedad', 'No mercy') },
];

const YEARLY = [6, 12, 24, 52];

function Choice({ on, title, hint, right, onPress }: { on: boolean; title: string; hint: string; right: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Tap
      onPress={onPress}
      feedback="select"
      style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, borderWidth: on ? 2 : 1, borderColor: on ? p.ember : p.line, backgroundColor: on ? p.emberSoft : p.surface, marginBottom: 10 }}
    >
      <View style={{ flex: 1 }}>
        <Txt v="headline">{title}</Txt>
        <Txt v="caption" tone="muted">
          {hint}
        </Txt>
      </View>
      <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 26, color: on ? p.ember : p.soft }}>{right}</Txt>
    </Tap>
  );
}

export default function Onboarding() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const s = useSettings();
  const folder = useLibrary((st) => st.folderName);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(s.name);
  const [picking, setPicking] = useState(false);

  const next = () => setStep((x) => x + 1);
  const done = async () => {
    s.set({ onboarded: true, name: name.trim() });
    await ensurePermission().catch(() => false);
    scheduleReminders();
    router.replace('/');
  };

  const steps = [
    <View key="0" style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <Flame size={64} color={p.ember} inner={p.gold} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(220).springify()}>
        <Txt v="hero" style={{ marginTop: 20 }}>
          {tx('Lee más.', 'Read more.')}{'\n'}
          <Txt v="hero" italic tone="ember">
            {tx('Mucho más.', 'Much more.')}
          </Txt>
        </Txt>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(340).springify()}>
        <Txt v="body" tone="soft" style={{ marginTop: 18, fontSize: 17, lineHeight: 25 }}>
          {tx('Ávido convierte cada página en progreso: rachas, niveles, misiones diarias y logros. Tú pones los libros; nosotros, las ganas de seguir.', 'Ávido turns every page into progress: streaks, levels, daily quests and achievements. You bring the books; we bring the drive to keep going.')}
        </Txt>
      </Animated.View>
    </View>,
    <View key="1" style={{ flex: 1, justifyContent: 'center' }}>
      <Txt v="eyebrow" tone="ember">
        01 · {tx('Presentaciones', 'Introductions')}
      </Txt>
      <Txt v="display" style={{ marginTop: 12 }}>
        {tx('¿Cómo te llamamos?', 'What should we call you?')}
      </Txt>
      <Input style={{ marginTop: 28, borderWidth: 0, borderBottomWidth: 2, borderRadius: 0, borderBottomColor: p.ember, height: 64 }}>
        <InputField
          value={name}
          onChangeText={setName}
          placeholder={tx('Tu nombre', 'Your name')}
          placeholderTextColor={p.faint}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={next}
          style={{ fontFamily: fonts.displayItalic, fontSize: 34, color: p.text }}
        />
      </Input>
      <Txt v="caption" tone="muted" style={{ marginTop: 12 }}>
        {tx('Opcional. Solo para saludarte.', 'Optional. Just to say hi.')}
      </Txt>
    </View>,
    <View key="2" style={{ flex: 1, justifyContent: 'center' }}>
      <Txt v="eyebrow" tone="ember">
        02 · {tx('Meta diaria', 'Daily goal')}
      </Txt>
      <Txt v="display" style={{ marginTop: 12, marginBottom: 22 }}>
        {tx('¿Cuánto lees al día?', 'How much will you read a day?')}
      </Txt>
      {GOALS.map((g) => (
        <Choice key={g.min} on={s.dailyGoalMin === g.min} title={g.label} hint={g.hint} right={`${g.min}′`} onPress={() => s.set({ dailyGoalMin: g.min })} />
      ))}
      <Txt v="caption" tone="muted" style={{ marginTop: 6 }}>
        {tx('Cumplirla mantiene viva tu racha. Puedes cambiarla cuando quieras.', 'Hitting it keeps your streak alive. You can change it anytime.')}
      </Txt>
    </View>,
    <View key="3" style={{ flex: 1, justifyContent: 'center' }}>
      <Txt v="eyebrow" tone="ember">
        03 · {tx('Reto anual', 'Yearly challenge')}
      </Txt>
      <Txt v="display" style={{ marginTop: 12, marginBottom: 22 }}>
        {tx('¿Cuántos libros este año?', 'How many books this year?')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {YEARLY.map((y) => {
          const on = s.yearlyGoal === y;
          return (
            <Tap
              key={y}
              onPress={() => s.set({ yearlyGoal: y })}
              feedback="select"
              style={{ width: '48%', aspectRatio: 1.3, borderRadius: 22, borderWidth: on ? 2 : 1, borderColor: on ? p.ember : p.line, backgroundColor: on ? p.emberSoft : p.surface, padding: 16, justifyContent: 'space-between' }}
            >
              <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 44, lineHeight: 48, color: on ? p.ember : p.text }}>{y}</Txt>
              <Txt v="caption" tone="muted">
                {y === 6 ? tx('Uno cada dos meses', 'One every two months') : y === 12 ? tx('Uno al mes', 'One a month') : y === 24 ? tx('Dos al mes', 'Two a month') : tx('Uno por semana', 'One a week')}
              </Txt>
            </Tap>
          );
        })}
      </View>
    </View>,
    <View key="4" style={{ flex: 1, justifyContent: 'center' }}>
      <Txt v="eyebrow" tone="ember">
        04 · {tx('Tu biblioteca', 'Your library')}
      </Txt>
      <Txt v="display" style={{ marginTop: 12 }}>
        {tx('Elige la carpeta de tus libros', 'Pick your books folder')}
      </Txt>
      <Txt v="body" tone="soft" style={{ marginTop: 12 }}>
        {tx('EPUB, PDF, TXT o Markdown. Ávido lee directamente de ahí y detecta los libros nuevos cada vez que abres la app.', 'EPUB, PDF, TXT or Markdown. Ávido reads straight from there and picks up new books every time you open the app.')}
      </Txt>
      <Tap
        onPress={async () => {
          setPicking(true);
          await pickFolder();
          setPicking(false);
        }}
        style={{ marginTop: 28, borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: folder ? p.mint : p.ember, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: folder ? p.mintSoft : p.emberSoft }}
      >
        <FolderOpen size={28} color={folder ? p.mint : p.ember} />
        <View style={{ flex: 1 }}>
          <Txt v="headline">{folder ? folder : picking ? tx('Abriendo…', 'Opening…') : tx('Seleccionar carpeta', 'Select folder')}</Txt>
          <Txt v="caption" tone="muted">
            {folder ? tx('Carpeta conectada · toca para cambiar', 'Folder connected · tap to change') : tx('Por ejemplo: Descargas/Libros', 'For example: Downloads/Books')}
          </Txt>
        </View>
      </Tap>
    </View>,
  ];

  const last = step === steps.length - 1;

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={{ flex: 1, paddingTop: insets.top + 20, paddingHorizontal: 26, paddingBottom: insets.bottom + 20 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {steps.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 3, backgroundColor: i <= step ? p.ember : p.line }} />
          ))}
        </View>
        <Animated.View key={step} entering={FadeInRight.springify().damping(18)} exiting={FadeOutLeft.duration(150)} style={{ flex: 1 }}>
          {steps[step]}
        </Animated.View>
        <View style={{ gap: 6, marginTop: 20 }}>
          <Cta label={step === 0 ? tx('Empezar', 'Get started') : last ? (folder ? tx('A leer', "Let's read") : tx('Elegir más tarde', 'Choose later')) : tx('Continuar', 'Continue')} onPress={last ? done : next} kind={last && !folder ? 'quiet' : 'primary'} />
          {step > 0 && (
            <Tap onPress={() => setStep((x) => x - 1)} style={{ alignSelf: 'center', padding: 10 }}>
              <Txt v="label" tone="muted">
                {tx('Atrás', 'Back')}
              </Txt>
            </Tap>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
