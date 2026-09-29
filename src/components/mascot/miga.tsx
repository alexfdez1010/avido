import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { Tap } from '@/components/kit';
import { usePalette } from '@/hooks/use-palette';
import { tx } from '@/i18n';

export type MigaMood = 'reading' | 'happy';

/** Vector artwork stays crisp at toast and hero sizes without loading image assets. */
export function Miga({ size = 120, mood = 'reading', active = true, still = false, interactive = false }: {
  size?: number; mood?: MigaMood; active?: boolean; still?: boolean; interactive?: boolean;
}) {
  const p = usePalette();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [reduced, setReduced] = useState(true);
  const [greeting, setGreeting] = useState(false);
  const breath = useSharedValue(0);
  const blink = useSharedValue(1);
  const wave = useSharedValue(0);
  const happy = mood === 'happy' || greeting;
  const moving = active && foreground && !reduced && !p.ink && !still;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReduced(value); }).catch(() => {});
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    const app = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => { mounted = false; motion.remove(); app.remove(); };
  }, []);

  useEffect(() => {
    if (!greeting) return;
    const timer = setTimeout(() => setGreeting(false), 1800);
    return () => clearTimeout(timer);
  }, [greeting]);

  useEffect(() => {
    breath.value = 0;
    blink.value = 1;
    wave.value = 0;
    if (moving) {
      breath.value = withRepeat(withTiming(1, { duration: happy ? 650 : 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
      blink.value = withRepeat(withSequence(withDelay(2900, withTiming(0.08, { duration: 90 })), withTiming(1, { duration: 140 })), -1);
      wave.value = withRepeat(withSequence(withTiming(1, { duration: 260 }), withTiming(-0.3, { duration: 260 }), withTiming(0, { duration: 260 }), withDelay(happy ? 200 : 3200, withTiming(0, { duration: 1 }))), -1);
    }
    return () => { cancelAnimation(breath); cancelAnimation(blink); cancelAnimation(wave); };
  }, [moving, happy, breath, blink, wave]);

  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -breath.value * (happy ? 6 : 3) }, { rotate: `${breath.value * (happy ? 3 : -1)}deg` }] }));
  const eyesStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));
  const wingStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wave.value * -24}deg` }] }));
  const green = p.ink ? '#444444' : '#43B981';
  const deep = p.ink ? '#111111' : '#226A50';
  const paper = p.ink ? '#FFFFFF' : '#FFF1D2';
  const ink = p.ink ? '#000000' : '#183C32';
  const art = (
    <View style={{ width: size, height: size }} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 160 160" style={StyleSheet.absoluteFill}>
        <Ellipse cx="80" cy="145" rx="45" ry="6" fill={p.text} opacity={0.08} />
        <Path d="M22 42l2-7 2 7 7 2-7 2-2 7-2-7-7-2z M134 93l2-6 2 6 6 2-6 2-2 6-2-6-6-2z" fill={p.gold} />
        <Circle cx="135" cy="33" r="3" fill={p.ember} opacity={0.45} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 160 160">
          <Path d="M57 132l-8 8q9 5 20 0l-1-8 M93 132l-1 8q11 5 20 0l-8-8" fill={p.ink ? '#777777' : '#DFAB56'} />
          <Path d="M37 65Q27 43 35 22L59 36Q80 28 101 36L125 22Q134 44 123 66Q137 111 113 131Q80 150 47 131Q23 109 37 65Z" fill={green} />
          <Path d="M41 46l-3-14 14 9 M108 41l14-9-3 14" fill={deep} />
          <Path d="M80 59C55 32 33 53 41 82Q45 98 64 100L80 112 96 100Q115 98 119 82C127 53 105 32 80 59Z" fill={paper} />
          <Path d="M42 91Q21 96 32 119Q41 127 49 112Z" fill={deep} />
          <Path d="M74 85Q80 81 86 85L80 94Z" fill={p.ink ? '#777777' : '#DFAB56'} />
          <Ellipse cx="49" cy="87" rx="7" ry="3" fill={green} opacity={0.35} />
          <Ellipse cx="111" cy="87" rx="7" ry="3" fill={green} opacity={0.35} />
          <Path d="M48 110Q64 104 80 114Q96 104 112 110L109 134Q95 130 80 139Q65 130 51 134Z" fill={deep} stroke={deep} strokeWidth="5" strokeLinejoin="round" />
          <Path d="M49 107Q64 104 80 113Q96 104 111 107L108 130Q93 126 80 135Q67 126 52 130Z" fill={paper} />
          <Path d="M80 114v20 M57 114l15 4 M57 120l13 4 M88 118l15-4 M90 124l12-4" stroke={p.ink ? '#777777' : '#CCB78E'} strokeWidth="2" strokeLinecap="round" />
          <Path d="M96 108v16l4-3 4 1v-15" fill={p.ink ? '#555555' : '#DFAB56'} />
        </Svg>
        <Animated.View style={[{ position: 'absolute', left: '28%', top: '40%', width: '44%', height: '13%' }, eyesStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 70 21">
            {happy ? <Path d="M5 13q8-13 16 0 M49 13q8-13 16 0" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" /> : <><Ellipse cx="14" cy="10" rx="5" ry="8" fill={ink} /><Ellipse cx="56" cy="10" rx="5" ry="8" fill={ink} /><Circle cx="16" cy="7" r="1.7" fill="white" /><Circle cx="58" cy="7" r="1.7" fill="white" /></>}
          </Svg>
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', left: '70%', top: '52%', width: '21%', height: '28%', transformOrigin: '20% 20%' }, wingStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 34 45"><Path d={happy ? 'M3 19Q8 0 20 2Q34 12 18 35Q7 42 3 19Z' : 'M3 4Q23 3 24 27Q18 44 8 29Z'} fill={deep} /></Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
  return interactive ? <Tap accessibilityRole="button" accessibilityLabel={tx('Saludar a Miga, tu búho lector', 'Say hello to Miga, your reading owl')} onPress={() => setGreeting(true)}>{art}</Tap> : art;
}
