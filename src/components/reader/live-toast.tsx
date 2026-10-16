import React, { useEffect, useRef, useState } from 'react';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { Miga } from '@/components/mascot/miga';
import { haptic, Txt } from '@/components/kit';
import type { Celebration } from '@/game/types';
import { tx } from '@/i18n';
import { useGame } from '@/store/game';
import type { ReaderTheme } from '@/theme/palette';

type Toast = { type: 'celebration'; item: Celebration } | { type: 'target'; minutes: number };

export function LiveToast({ theme, top, enabled = true, targetMin = null, sessionSec = 0 }: { theme: ReaderTheme; top: number; enabled?: boolean; targetMin?: number | null; sessionSec?: number }) {
  const queue = useGame((s) => s.queue);
  const seen = useRef(queue.length);
  const [targetHandled, setTargetHandled] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Consume this moment even in pure reading mode; never replay it later.
  if (!targetHandled && targetMin !== null && sessionSec >= targetMin * 60) {
    setTargetHandled(true);
    if (enabled) setToast({ type: 'target', minutes: targetMin });
  }
  if (!enabled && toast) setToast(null);

  useEffect(() => {
    if (enabled && toast?.type !== 'target' && queue.length > seen.current) {
      setToast({ type: 'celebration', item: queue[queue.length - 1] });
      haptic('success');
    }
    seen.current = queue.length;
  }, [enabled, queue, toast?.type]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!enabled || !toast) return null;
  const item = toast.type === 'celebration' ? toast.item : null;
  return (
    <Animated.View
      testID={toast.type === 'target' ? 'reader-target-toast' : 'reader-live-toast'}
      key={item?.id ?? 'reading-target'}
      entering={FadeInUp.duration(180)}
      exiting={FadeOutUp.duration(200)}
      pointerEvents="none"
      style={{
        maxWidth: '94%',
        position: 'absolute',
        top,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.id === 'eink' ? '#000000' : theme.statusBar === 'light' ? '#2A2520' : '#1F1C18',
        paddingVertical: 10,
        paddingLeft: 12,
        paddingRight: 16,
        borderRadius: 999,
        zIndex: 50,
        elevation: 10,
      }}
    >
      <Miga size={38} mood="happy" still={toast.type === 'target' || theme.id === 'eink'} />
      {item && <Txt style={{ fontFamily: 'Fraunces_900Black_Italic', fontSize: 16, color: theme.id === 'eink' ? '#FFFFFF' : '#F2B544' }}>{item.big && item.big.length <= 3 ? item.big : '✦'}</Txt>}
      {toast.type === 'target' ? (
        <Txt v="label" style={{ flexShrink: 1, color: '#F3EDE2' }}>
          {tx(`Ya llevas ${toast.minutes} minutos leyendo`, `You’ve been reading for ${toast.minutes} minutes`)}
        </Txt>
      ) : (
        <Txt v="label" style={{ flexShrink: 1, color: '#F3EDE2' }} numberOfLines={1}>
          {toast.item.title}
          {toast.item.kind === 'quest' || toast.item.kind === 'achievement' ? ` · ${toast.item.subtitle}` : ''}
        </Txt>
      )}
      {!!item?.xp && (
        <Txt v="mono" style={{ color: theme.id === 'eink' ? '#FFFFFF' : '#F2B544' }}>
          +{Math.round(item.xp)}
        </Txt>
      )}
    </Animated.View>
  );
}
