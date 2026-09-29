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

const GOALS = [
  { min: 10, label: 'Tranquilo', hint: 'Un hábito que no falla' },
  { min: 20, label: 'Constante', hint: 'El punto dulce' },
  { min: 30, label: 'Ambicioso', hint: '~20 libros al año' },
  { min: 60, label: 'Voraz', hint: 'Sin piedad' },
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
          Lee más.{'\n'}
          <Txt v="hero" italic tone="ember">
            Mucho más.
          </Txt>
        </Txt>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(340).springify()}>
        <Txt v="body" tone="soft" style={{ marginTop: 18, fontSize: 17, lineHeight: 25 }}>
          Ávido convierte cada página en progreso: rachas, niveles, misiones diarias y logros. Tú pones los libros; nosotros, las ganas de seguir.
        </Txt>
      </Animated.View>
    </View>,
    <View key="1" style={{ flex: 1, justifyContent: 'center' }}>
      <Txt v="eyebrow" tone="ember">
        01 · Presentaciones
      </Txt>
      <Txt v="display" style={{ marginTop: 12 }}>
        ¿Cómo te llamamos?
      </Txt>
      <Input style={{ marginTop: 28, borderWidth: 0, borderBottomWidth: 2, borderRadius: 0, borderBottomColor: p.ember, height: 64 }}>
        <InputField
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          placeholderTextColor={p.faint}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={next}
          style={{ fontFamily: fonts.displayItalic, fontSize: 34, color: p.text }}
        />
      </Input>
      <Txt v="caption" tone="muted" style={{ marginTop: 12 }}>
        Opcional. Solo para saludarte.
      </Txt>
    </View>,
    <View key="2" style={{ flex: 1, justifyContent: 'center' }}>
      <Txt v="eyebrow" tone="ember">
        02 · Meta diaria
      </Txt>
      <Txt v="display" style={{ marginTop: 12, marginBottom: 22 }}>
        ¿Cuánto lees al día?
      </Txt>
      {GOALS.map((g) => (
        <Choice key={g.min} on={s.dailyGoalMin === g.min} title={g.label} hint={g.hint} right={`${g.min}′`} onPress={() => s.set({ dailyGoalMin: g.min })} />
      ))}
      <Txt v="caption" tone="muted" style={{ marginTop: 6 }}>
        Cumplirla mantiene viva tu racha. Puedes cambiarla cuando quieras.
      </Txt>
    </View>,
    <View key="3" style={{ flex: 1, justifyContent: 'center' }}>
      <Txt v="eyebrow" tone="ember">
        03 · Reto anual
      </Txt>
      <Txt v="display" style={{ marginTop: 12, marginBottom: 22 }}>
        ¿Cuántos libros este año?
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
                {y === 6 ? 'Uno cada dos meses' : y === 12 ? 'Uno al mes' : y === 24 ? 'Dos al mes' : 'Uno por semana'}
              </Txt>
            </Tap>
          );
        })}
      </View>
    </View>,
    <View key="4" style={{ flex: 1, justifyContent: 'center' }}>
      <Txt v="eyebrow" tone="ember">
        04 · Tu biblioteca
      </Txt>
      <Txt v="display" style={{ marginTop: 12 }}>
        Elige la carpeta de tus libros
      </Txt>
      <Txt v="body" tone="soft" style={{ marginTop: 12 }}>
        EPUB, PDF, TXT o Markdown. Ávido lee directamente de ahí y detecta los libros nuevos cada vez que abres la app.
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
          <Txt v="headline">{folder ? folder : picking ? 'Abriendo…' : 'Seleccionar carpeta'}</Txt>
          <Txt v="caption" tone="muted">
            {folder ? 'Carpeta conectada · toca para cambiar' : 'Por ejemplo: Descargas/Libros'}
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
          <Cta label={step === 0 ? 'Empezar' : last ? (folder ? 'A leer' : 'Elegir más tarde') : 'Continuar'} onPress={last ? done : next} kind={last && !folder ? 'quiet' : 'primary'} />
          {step > 0 && (
            <Tap onPress={() => setStep((x) => x - 1)} style={{ alignSelf: 'center', padding: 10 }}>
              <Txt v="label" tone="muted">
                Atrás
              </Txt>
            </Tap>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
