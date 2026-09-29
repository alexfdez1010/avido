import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { usePalette } from '@/hooks/use-palette';

export function Ring({ size, stroke = 10, value, color, track, children }: { size: number; stroke?: number; value: number; color?: string; track?: string; children?: React.ReactNode }) {
  const p = usePalette();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? p.line} strokeWidth={stroke} fill="none" />
        {v > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color ?? p.ember}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - v)}
            strokeLinecap="round"
          />
        )}
      </Svg>
      {children}
    </View>
  );
}
