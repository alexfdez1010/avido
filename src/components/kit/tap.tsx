import * as Haptics from 'expo-haptics';
import React from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Pressable } from '@/components/ui/pressable';
import { useSettings } from '@/store/settings';

const APressable = Animated.createAnimatedComponent(Pressable);

export function haptic(kind: 'light' | 'medium' | 'heavy' | 'success' | 'select' = 'light') {
  if (!useSettings.getState().haptics) return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else if (kind === 'select') Haptics.selectionAsync().catch(() => {});
  else
    Haptics.impactAsync(
      kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
}

type TapProps = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scale?: number; feedback?: Parameters<typeof haptic>[0] | false };

export function Tap({ style, scale = 0.97, feedback = 'light', onPress, onPressIn, onPressOut, children, ...rest }: TapProps) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <APressable
      {...rest}
      onPressIn={(e) => {
        s.set(withSpring(scale, { damping: 18, stiffness: 420 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withSpring(1, { damping: 14, stiffness: 300 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (feedback) haptic(feedback);
        onPress?.(e);
      }}
      style={[style, anim]}
    >
      {children}
    </APressable>
  );
}
