import { FolderBrowserHost } from '@/components/folder-browser';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

import { CelebrationHost } from '@/components/celebration';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { usePalette } from '@/hooks/use-palette';
import { scanLibrary } from '@/lib/library';
import { scheduleReminders } from '@/lib/notifications';
import { useGame } from '@/store/game';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import '@/global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const stores = [useSettings, useLibrary, useGame];
    const check = () => {
      if (stores.every((s) => s.persist.hasHydrated())) setReady(true);
    };
    const unsubs = stores.map((s) => s.persist.onFinishHydration(check));
    check();
    return () => unsubs.forEach((u) => u());
  }, []);
  return ready;
}

export default function RootLayout() {
  const hydrated = useHydrated();
  const fontsReady = useAppFonts();
  const ready = hydrated && fontsReady;
  const p = usePalette();
  const mode = p.mode;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(p.bg).catch(() => {});
  }, [p.bg]);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
    useGame.getState().reconcile();
    useGame.getState().evaluate();
    if (useLibrary.getState().folderUri) scanLibrary();
    scheduleReminders();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        useGame.getState().reconcile();
        if (useLibrary.getState().folderUri) scanLibrary();
      } else if (st === 'background') {
        scheduleReminders();
      }
    });
    return () => sub.remove();
  }, [ready]);

  if (!ready) return null;

  const navTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: p.bg }}>
        <ReducedMotionConfig mode={p.ink ? ReduceMotion.Always : ReduceMotion.System} />
        <KeyboardProvider>
        <GluestackUIProvider mode={mode}>
          <ThemeProvider value={{ ...navTheme, colors: { ...navTheme.colors, background: p.bg, card: p.bg, text: p.text, border: p.line, primary: p.ember } }}>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg }, animation: p.ink ? 'none' : 'fade' }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" options={{ animation: p.ink ? 'none' : 'fade', gestureEnabled: false }} />
              <Stack.Screen name="discover" options={{ animation: p.ink ? 'none' : 'fade' }} />
              <Stack.Screen name="reader/[id]" options={{ animation: p.ink ? 'none' : 'fade' }} />
            </Stack>
            <FolderBrowserHost />
            <CelebrationHost />
          </ThemeProvider>
        </GluestackUIProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaListener>
  );
}
