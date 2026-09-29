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
import { openFolderBrowser } from '@/store/folder-browser';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { fonts } from '@/theme/fonts';
import { tx } from '@/i18n';

const GOALS = [
  { min: 10, label: tx('Tranquilo', 'Easy') },
  { min: 20, label: tx('Constante', 'Steady') },
  { min: 30, label: tx('Ambicioso', 'Ambitious') },
  { min: 60, label: tx('Voraz', 'Voracious') },
];

const YEARLY = [6, 12, 24, 52];

function Choice({ on, title, right, onPress }: { on: boolean; title: string; right: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Tap
      onPress={onPress}
      feedback="select"
      style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, borderWidth: 2, borderColor: on ? p.ember : 'transparent', backgroundColor: on ? p.emberSoft : p.surface, marginBottom: 10 }}
    >
      <View style={{ flex: 1 }}>
        <Txt v="headline">{title}</Txt>
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
  const step = s.onboardStep;
  const setStep = (n: number) => s.set({ onboardStep: n });
  const [name, setName] = useState(s.name);
  const [picking, setPicking] = useState(false);
  const [pickFailed, setPickFailed] = useState(false);

  const next = () => {
    s.set({ onboardStep: step + 1, name: name.trim() });
  };
  const done = async () => {
    s.set({ onboarded: true, onboardStep: 0, name: name.trim() });
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
          {tx('Rachas, niveles y misiones por cada página.', 'Streaks, levels and quests for every page.')}
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
    </View>,
    <View key="2" style={{ flex: 1, justifyContent: 'center' }}>
      <Txt v="eyebrow" tone="ember">
        02 · {tx('Meta diaria', 'Daily goal')}
      </Txt>
      <Txt v="display" style={{ marginTop: 12, marginBottom: 22 }}>
        {tx('¿Cuánto lees al día?', 'How much will you read a day?')}
      </Txt>
      {GOALS.map((g) => (
        <Choice key={g.min} on={s.dailyGoalMin === g.min} title={g.label} right={`${g.min}′`} onPress={() => s.set({ dailyGoalMin: g.min })} />
      ))}
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
              style={{ width: '48%', aspectRatio: 1.3, borderRadius: 22, borderWidth: 2, borderColor: on ? p.ember : 'transparent', backgroundColor: on ? p.emberSoft : p.surface, padding: 16, justifyContent: 'space-between' }}
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
        EPUB · PDF · TXT · MD
      </Txt>
      <Tap
        onPress={async () => {
          setPicking(true);
          const res = await pickFolder();
          setPicking(false);
          setPickFailed(res === 'failed');
        }}
        style={{ marginTop: 28, borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: folder ? p.mintSoft : p.emberSoft }}
      >
        <FolderOpen size={28} color={folder ? p.mint : p.ember} />
        <View style={{ flex: 1 }}>
          <Txt v="headline">{folder ? folder : picking ? tx('Abriendo…', 'Opening…') : tx('Seleccionar carpeta', 'Select folder')}</Txt>
        </View>
      </Tap>
      {pickFailed && !folder && (
        <Txt v="caption" tone="ember" style={{ marginTop: 12 }}>
          {tx('El selector del sistema ha fallado.', 'The system picker failed.')}
        </Txt>
      )}
      <Tap onPress={openFolderBrowser} style={{ alignSelf: 'flex-start', paddingVertical: 12, marginTop: 4 }}>
        <Txt v="label" tone="muted">
          {tx('¿No funciona? Buscar en el almacenamiento', 'Not working? Browse storage')}
        </Txt>
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
            <Tap onPress={() => setStep(step - 1)} style={{ alignSelf: 'center', padding: 10 }}>
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
