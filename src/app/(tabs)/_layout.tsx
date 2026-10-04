import { Redirect, Tabs } from 'expo-router';
import { BookOpen, Flame as FlameIcon, Trophy, UserRound } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT, Tap, Txt } from '@/components/kit';
import { usePalette } from '@/hooks/use-palette';
import { useSettings } from '@/store/settings';
import { tx } from '@/i18n';
import { fonts } from '@/theme/fonts';

const ICONS = { index: FlameIcon, library: BookOpen, trophies: Trophy, profile: UserRound } as const;
const LABELS = { index: tx('Hoy', 'Today'), library: tx('Biblioteca', 'Library'), trophies: tx('Logros', 'Trophies'), profile: tx('Tú', 'You') } as const;

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

function TabBar({ state, navigation }: TabBarProps) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: insets.bottom,
        backgroundColor: p.ink ? p.bg : p.mode === 'dark' ? 'rgba(15,13,10,0.98)' : 'rgba(243,237,226,0.98)',
        borderTopWidth: p.ink ? 1.5 : 1,
        borderTopColor: p.ink ? p.text : p.line,
      }}
    >
      <View style={{ flexDirection: 'row', height: TAB_BAR_HEIGHT, paddingHorizontal: 8 }}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const name = route.name as keyof typeof ICONS;
          const Icon = ICONS[name];
          if (!Icon) return null;
          return (
            <Tap
              key={route.key}
              feedback="select"
              scale={0.94}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={LABELS[name]}
              onPress={() => {
                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
              }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 60,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? (p.ink ? p.text : p.emberSoft) : 'transparent',
                }}
              >
                <Icon size={21} color={focused ? (p.ink ? p.bg : p.ember) : p.muted} strokeWidth={focused ? 2.3 : 1.9} />
              </View>
              <Txt v="caption" style={{ fontSize: 12, fontFamily: focused ? fonts.uiBold : fonts.uiMedium }} color={focused ? p.text : p.muted}>
                {LABELS[name]}
              </Txt>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const onboarded = useSettings((s) => s.onboarded);
  const p = usePalette();
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: p.bg }, animation: 'shift' }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="trophies" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
