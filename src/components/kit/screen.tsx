import React from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePalette } from '@/hooks/use-palette';

import { Txt } from './txt';

export const TAB_BAR_HEIGHT = 68;
export const TAB_BAR_SPACE = TAB_BAR_HEIGHT + 8;
export const GUTTER = 20;

export function Screen({ children, scroll = true, pad = GUTTER, ...rest }: ScrollViewProps & { scroll?: boolean; pad?: number }) {
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
          paddingTop: insets.top + 18,
          paddingHorizontal: pad,
          paddingBottom: insets.bottom + TAB_BAR_SPACE + 24,
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

export function PageHeader({ eyebrow, title, right, children }: { eyebrow?: React.ReactNode; title: React.ReactNode; right?: React.ReactNode; children?: React.ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: p.ink ? p.text : p.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
        {typeof eyebrow === 'string' ? (
          <Txt v="eyebrow" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
            {eyebrow}
          </Txt>
        ) : (
          <View style={{ flex: 1 }}>{eyebrow}</View>
        )}
        {right}
      </View>
      {typeof title === 'string' ? (
        <Txt v="display" style={{ marginTop: 6 }}>
          {title}
        </Txt>
      ) : (
        <View style={{ marginTop: 6 }}>{title}</View>
      )}
      {children}
    </View>
  );
}

export function Card({ children, style, tint, flat }: { children: React.ReactNode; style?: object; tint?: string; flat?: boolean }) {
  const p = usePalette();
  return (
    <View
      style={[
        {
          backgroundColor: flat ? 'transparent' : tint ?? p.surface,
          borderRadius: 18,
          borderWidth: p.ink ? 1.5 : 1,
          borderColor: p.ink ? p.text : tint ? 'transparent' : p.line,
          padding: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider({ inset = 0, style }: { inset?: number; style?: object }) {
  const p = usePalette();
  return <View style={[{ height: 1, marginLeft: inset, backgroundColor: p.ink ? p.faint : p.line }, style]} />;
}

export function SectionTitle({ children, right, first }: { children: React.ReactNode; right?: React.ReactNode; first?: boolean }) {
  const p = usePalette();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: first ? 22 : 36,
        marginBottom: 14,
        minHeight: 24,
      }}
    >
      {typeof children === 'string' ? (
        <Txt v="eyebrow" tone="soft">
          {children}
        </Txt>
      ) : (
        children
      )}
      <View style={{ flex: 1, height: 1, backgroundColor: p.ink ? p.faint : p.line }} />
      {right}
    </View>
  );
}

export function Stat({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Txt v="numeral" color={accent} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 24, lineHeight: 28 }}>
        {value}
      </Txt>
      <Txt v="eyebrow" tone="muted" numberOfLines={1} style={{ fontSize: 9.5 }}>
        {label}
      </Txt>
    </View>
  );
}

export function StatRow({ items }: { items: { value: string; label: string; accent?: string }[] }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row' }}>
      {items.map((it, i) => (
        <View key={it.label} style={{ flex: 1, flexDirection: 'row' }}>
          {i > 0 && <View style={{ width: 1, backgroundColor: p.ink ? p.faint : p.line, marginRight: 14 }} />}
          <Stat {...it} />
        </View>
      ))}
    </View>
  );
}
