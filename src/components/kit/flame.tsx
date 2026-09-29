import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Flame({ size = 22, color = '#F2B544', inner = '#FFE7B0', dim = false }: { size?: number; color?: string; inner?: string; dim?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={dim ? 0.35 : 1}>
      <Path d="M12 2c.6 3.2 3 4.8 4.6 7 1.4 2 2.1 3.7 2.1 5.7A6.7 6.7 0 0 1 12 21.4a6.7 6.7 0 0 1-6.7-6.7c0-2.5 1.2-4.4 2.6-5.9.3 1.6 1 2.7 2.2 3.3C9.6 8.9 10.5 5 12 2Z" fill={color} />
      <Path d="M12 12.2c1.7 1.6 2.9 2.9 2.9 4.6a2.9 2.9 0 0 1-5.8 0c0-1.3.7-2.2 1.5-3 .2.7.6 1.1 1.1 1.3-.2-1-.1-2 .3-2.9Z" fill={inner} />
    </Svg>
  );
}
