import React from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePalette } from '@/hooks/use-palette';

export const TAB_BAR_SPACE = 96;

export function Screen({ children, scroll = true, pad = 22, ...rest }: ScrollViewProps & { scroll?: boolean; pad?: number }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  if (!scroll)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: p.bg,
          paddingTop: insets.top,
          paddingHorizontal: pad,
        }}
      >
        {children}
      </View>
    );
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView
        {...rest}
        style={{ flex: 1, backgroundColor: p.bg }}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: pad,
          paddingBottom: insets.bottom + TAB_BAR_SPACE + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: p.bg,
          opacity: 0.94,
        }}
      />
    </View>
  );
}

export function Card({ children, style, tint }: { children: React.ReactNode; style?: object; tint?: string }) {
  const p = usePalette();
  return (
    <View
      style={[
        {
          backgroundColor: tint ?? p.surface,
          borderRadius: 22,
          padding: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: 30,
        marginBottom: 12,
      }}
    >
      {children}
      {right}
    </View>
  );
}
