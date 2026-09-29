import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';
import { usePalette } from '@/hooks/use-palette';
import { fonts } from '@/theme/fonts';

import { haptic } from './tap';

type Props = {
  label: string;
  onPress?: () => void;
  kind?: 'primary' | 'ghost' | 'quiet';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
};

export function Cta({ label, onPress, kind = 'primary', icon, loading, disabled, compact }: Props) {
  const p = usePalette();
  const bg = kind === 'primary' ? p.ember : kind === 'ghost' ? 'transparent' : p.raised;
  const fg = kind === 'primary' ? p.onEmber : p.text;
  return (
    <Button
      onPress={() => {
        haptic('medium');
        onPress?.();
      }}
      isDisabled={disabled || loading}
      style={{
        backgroundColor: bg,
        borderRadius: 999,
        height: compact ? 42 : 56,
        paddingHorizontal: compact ? 18 : 26,
        borderWidth: kind === 'ghost' ? 1 : 0,
        borderColor: p.line,
        opacity: disabled ? 0.45 : 1,
        gap: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <View>{icon}</View> : null}
      <ButtonText style={{ color: fg, fontFamily: fonts.uiBold, fontSize: compact ? 14 : 16, letterSpacing: -0.1, fontWeight: undefined }}>{label}</ButtonText>
    </Button>
  );
}
