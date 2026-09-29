import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Cta, Flame, haptic, Txt } from '@/components/kit';
import type { Celebration } from '@/game/types';
import { usePalette } from '@/hooks/use-palette';
import { seededRandom } from '@/lib/hash';
import { useGame } from '@/store/game';
import { fonts } from '@/theme/fonts';

const { width: W, height: H } = Dimensions.get('window');

function Particle({ i, color, seed }: { i: number; color: string; seed: number }) {
  const rand = useMemo(() => seededRandom(seed * 131 + i * 17), [seed, i]);
  const angle = rand() * Math.PI * 2;
  const dist = 90 + rand() * 170;
  const size = 4 + rand() * 7;
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(120 + rand() * 120, withTiming(1, { duration: 1100 + rand() * 700, easing: Easing.out(Easing.cubic) }));
  }, [t, rand]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateX: Math.cos(angle) * dist * t.value }, { translateY: Math.sin(angle) * dist * t.value + 60 * t.value * t.value }, { rotate: `${t.value * 360}deg` }],
  }));
  return <Animated.View style={[{ position: 'absolute', width: size, height: size * (i % 3 === 0 ? 2.4 : 1), borderRadius: i % 2 ? size : 1, backgroundColor: color }, style]} />;
}

function Glow({ color }: { color: string }) {
  const s = useSharedValue(0.9);
  useEffect(() => {
    s.value = withRepeat(withSequence(withTiming(1.08, { duration: 1400 }), withTiming(0.9, { duration: 1400 })), -1);
  }, [s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={[{ position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: color, opacity: 0.14 }, style]} />;
}

const KIND_LABEL: Record<Celebration['kind'], string> = {
  level: 'Subes de nivel',
  achievement: 'Logro desbloqueado',
  goal: 'Racha',
  finish: 'Libro terminado',
  quest: 'Misión',
  freeze: 'Protector de racha',
  streak: 'Racha',
};

function Card({ c, onDone }: { c: Celebration; onDone: () => void }) {
  const p = usePalette();
  const accent = c.kind === 'achievement' || c.kind === 'level' ? p.gold : c.kind === 'freeze' ? '#8FD3FF' : c.kind === 'quest' ? p.mint : p.ember;
  const seed = c.id.length * 7 + c.title.length;
  const colors = [p.ember, p.gold, p.mint, p.violet, p.text];
  const pop = useSharedValue(0.6);
  useEffect(() => {
    haptic(c.kind === 'quest' ? 'medium' : 'success');
    pop.value = withSpring(1, { damping: 9, stiffness: 160 });
  }, [c, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const bigSize = (c.big?.length ?? 1) > 3 ? 44 : (c.big?.length ?? 1) > 2 ? 64 : 92;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(180)} style={[StyleSheet.absoluteFill, { backgroundColor: p.scrim, alignItems: 'center', justifyContent: 'center', zIndex: 1000 }]}>
      <View style={{ position: 'absolute', top: H * 0.3, left: W / 2, width: 0, height: 0, alignItems: 'center', justifyContent: 'center' }}>
        {Array.from({ length: 34 }).map((_, i) => (
          <Particle key={`${c.id}-${i}`} i={i} seed={seed} color={colors[i % colors.length]} />
        ))}
      </View>
      <Animated.View
        entering={ZoomIn.springify().damping(14)}
        style={{ width: W - 48, backgroundColor: p.surface, borderRadius: 32, paddingHorizontal: 26, paddingTop: 34, paddingBottom: 22, alignItems: 'center', borderWidth: 1, borderColor: p.line, overflow: 'hidden' }}
      >
        <Txt v="eyebrow" color={accent}>
          {KIND_LABEL[c.kind]}
        </Txt>
        <View style={{ height: 180, alignItems: 'center', justifyContent: 'center', marginVertical: 8 }}>
          <Glow color={accent} />
          <Animated.View style={[{ alignItems: 'center' }, popStyle]}>
            {c.kind === 'goal' || c.kind === 'streak' ? (
              <View style={{ alignItems: 'center' }}>
                <Flame size={84} color={p.ember} inner={p.gold} />
                <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 40, lineHeight: 44, color: p.text, marginTop: -4 }}>{c.big}</Txt>
              </View>
            ) : (
              <Txt style={{ fontFamily: fonts.displayBlackItalic, fontSize: bigSize, lineHeight: bigSize * 1.1, color: accent }}>{c.big ?? '★'}</Txt>
            )}
          </Animated.View>
        </View>
        <Txt v="display" center>
          {c.title}
        </Txt>
        <Txt v="body" tone="soft" center style={{ marginTop: 8, maxWidth: 280 }}>
          {c.subtitle}
        </Txt>
        {!!c.xp && (
          <View style={{ marginTop: 18, backgroundColor: p.goldSoft, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 }}>
            <Txt v="mono" color={p.gold} style={{ fontSize: 14 }}>
              +{Math.round(c.xp)} XP
            </Txt>
          </View>
        )}
        <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
          <Cta label="¡Vamos!" onPress={onDone} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export function CelebrationHost() {
  const current = useGame((s) => s.queue[0]);
  const dismiss = useGame((s) => s.dismiss);
  const hold = useGame((s) => s.hold);
  if (!current || hold) return null;
  return <Card key={current.id} c={current} onDone={dismiss} />;
}
