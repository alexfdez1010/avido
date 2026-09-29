import React, { useEffect, useRef, useState } from 'react';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { haptic, Txt } from '@/components/kit';
import type { Celebration } from '@/game/types';
import { useGame } from '@/store/game';
import type { ReaderTheme } from '@/theme/palette';

export function LiveToast({ theme, top }: { theme: ReaderTheme; top: number }) {
  const queue = useGame((s) => s.queue);
  const seen = useRef(queue.length);
  const [item, setItem] = useState<Celebration | null>(null);

  useEffect(() => {
    if (queue.length > seen.current) {
      setItem(queue[queue.length - 1]);
      haptic('success');
      const t = setTimeout(() => setItem(null), 3200);
      seen.current = queue.length;
      return () => clearTimeout(t);
    }
    seen.current = queue.length;
  }, [queue]);

  if (!item) return null;
  return (
    <Animated.View
      key={item.id}
      entering={FadeInUp.springify().damping(16)}
      exiting={FadeOutUp.duration(200)}
      pointerEvents="none"
      style={{
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
      <Txt style={{ fontFamily: 'Fraunces_900Black_Italic', fontSize: 16, color: theme.id === 'eink' ? '#FFFFFF' : '#F2B544' }}>{item.big && item.big.length <= 3 ? item.big : '✦'}</Txt>
      <Txt v="label" style={{ color: '#F3EDE2' }} numberOfLines={1}>
        {item.title}
        {item.kind === 'quest' || item.kind === 'achievement' ? ` · ${item.subtitle}` : ''}
      </Txt>
      {!!item.xp && (
        <Txt v="mono" style={{ color: theme.id === 'eink' ? '#FFFFFF' : '#F2B544' }}>
          +{Math.round(item.xp)}
        </Txt>
      )}
    </Animated.View>
  );
}
