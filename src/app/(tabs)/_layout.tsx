import { Redirect, Tabs } from 'expo-router';
import { BookOpen, Flame as FlameIcon, Trophy, UserRound } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tap, Txt } from '@/components/kit';
import { usePalette } from '@/hooks/use-palette';
import { useSettings } from '@/store/settings';
import { tx } from '@/i18n';

const ICONS = { index: FlameIcon, library: BookOpen, trophies: Trophy, profile: UserRound } as const;
const LABELS = { index: tx('Hoy', 'Today'), library: tx('Biblioteca', 'Library'), trophies: tx('Logros', 'Trophies'), profile: tx('Tú', 'You') } as const;

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

function TabBar({ state, navigation }: TabBarProps) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 12), alignItems: 'center' }}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: p.ink ? p.bg : p.mode === 'dark' ? 'rgba(30,27,23,0.97)' : 'rgba(251,248,242,0.97)',
          borderRadius: 999,
          padding: 6,
          gap: 4,
          borderWidth: p.ink ? 1.5 : 0,
          borderColor: p.text,
          shadowColor: '#000',
          shadowOpacity: p.ink ? 0 : 0.3,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: p.ink ? 0 : 12,
        }}
      >
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const name = route.name as keyof typeof ICONS;
          const Icon = ICONS[name];
          if (!Icon) return null;
          return (
            <Tap
              key={route.key}
              feedback="select"
              onPress={() => {
                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                height: 48,
                paddingHorizontal: focused ? 18 : 15,
                borderRadius: 999,
                backgroundColor: focused ? p.ember : 'transparent',
              }}
            >
              <Icon size={20} color={focused ? p.onEmber : p.muted} strokeWidth={focused ? 2.4 : 2} />
              {focused && (
                <Txt v="label" style={{ color: p.onEmber, fontSize: 13.5 }}>
                  {LABELS[name]}
                </Txt>
              )}
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
