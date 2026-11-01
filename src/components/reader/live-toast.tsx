import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Check, X } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { Miga } from '@/components/mascot/miga';
import { haptic, Tap, Txt } from '@/components/kit';
import type { Celebration } from '@/game/types';
import { tx } from '@/i18n';
import { useGame } from '@/store/game';
import type { ReaderTheme } from '@/theme/palette';

type Toast = { type: 'celebration'; item: Celebration } | { type: 'target'; minutes: number };

export function LiveToast({ theme, top, enabled = true, targetEnabled = enabled, targetMin = null, sessionSec = 0 }: { theme: ReaderTheme; top: number; enabled?: boolean; targetEnabled?: boolean; targetMin?: number | null; sessionSec?: number }) {
  const queue = useGame((s) => s.queue);
  const seen = useRef(queue.length);
  const [targetHandled, setTargetHandled] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // An explicitly chosen reminder also works with reader chrome hidden.
  if (!targetHandled && targetEnabled && targetMin !== null && sessionSec >= targetMin * 60) {
    setTargetHandled(true);
    setToast({ type: 'target', minutes: targetMin });
  }
  if (toast?.type === 'celebration' && !enabled) setToast(null);

  useEffect(() => {
    if (enabled && toast?.type !== 'target' && queue.length > seen.current) {
      setToast({ type: 'celebration', item: queue[queue.length - 1] });
      haptic('success');
    }
    seen.current = queue.length;
  }, [enabled, queue, toast?.type]);

  useEffect(() => {
    if (!toast) return;
    if (toast.type === 'target') {
      haptic('success');
      return;
    }
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast || !(toast.type === 'target' ? targetEnabled : enabled)) return null;
  const item = toast.type === 'celebration' ? toast.item : null;
  return (
    <Animated.View
      testID={toast.type === 'target' ? 'reader-target-toast' : 'reader-live-toast'}
      key={item?.id ?? 'reading-target'}
      entering={theme.id === 'eink' ? undefined : FadeInUp.duration(180)}
      exiting={theme.id === 'eink' ? undefined : FadeOutUp.duration(200)}
      pointerEvents={toast.type === 'target' ? 'auto' : 'none'}
      style={{
        maxWidth: '94%',
        position: 'absolute',
        top,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.id === 'eink' ? '#000000' : theme.statusBar === 'light' ? '#2A2520' : '#1F1C18',
        paddingVertical: toast.type === 'target' ? 14 : 10,
        paddingLeft: 12,
        paddingRight: toast.type === 'target' ? 6 : 16,
        borderRadius: toast.type === 'target' ? 20 : 999,
        zIndex: 50,
        elevation: 10,
      }}
    >
      {toast.type === 'target' ? <Check size={26} color={theme.id === 'eink' ? '#FFFFFF' : '#3DD68C'} /> : <Miga size={38} mood="happy" still={theme.id === 'eink'} />}
      {item && <Txt style={{ fontFamily: 'Fraunces_900Black_Italic', fontSize: 16, color: theme.id === 'eink' ? '#FFFFFF' : '#F2B544' }}>{item.big && item.big.length <= 3 ? item.big : '✦'}</Txt>}
      {toast.type === 'target' ? (
        <View style={{ flexShrink: 1, gap: 3 }} accessibilityLiveRegion="polite">
          <Txt v="headline" style={{ color: '#FFFFFF' }}>{tx('Tiempo completado', 'Reading time complete')}</Txt>
          <Txt v="caption" style={{ color: '#F3EDE2' }}>{tx(`Has leído ${toast.minutes} minutos`, `You’ve read for ${toast.minutes} minutes`)}</Txt>
        </View>
      ) : (
        <Txt v="label" style={{ flexShrink: 1, color: '#F3EDE2' }} numberOfLines={1}>
          {toast.item.title}
          {toast.item.kind === 'quest' || toast.item.kind === 'achievement' ? ` · ${toast.item.subtitle}` : ''}
        </Txt>
      )}
      {toast.type === 'target' && (
        <Tap testID="reader-target-dismiss" accessibilityRole="button" accessibilityLabel={tx('Cerrar aviso de tiempo completado', 'Dismiss completed reading time')} feedback={false} onPress={() => setToast(null)} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color="#FFFFFF" />
        </Tap>
      )}
      {!!item?.xp && (
        <Txt v="mono" style={{ color: theme.id === 'eink' ? '#FFFFFF' : '#F2B544' }}>
          +{Math.round(item.xp)}
        </Txt>
      )}
    </Animated.View>
  );
}
