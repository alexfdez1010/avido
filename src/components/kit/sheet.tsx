import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetScrollView,
} from '@/components/ui/actionsheet';
import { usePalette } from '@/hooks/use-palette';

type Props = { open: boolean; onClose: () => void; children: React.ReactNode; bg?: string; fg?: string; scroll?: boolean; maxHeight?: number | `${number}%` };

export function Sheet({ open, onClose, children, bg, fg, scroll, maxHeight = '85%' }: Props) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Actionsheet isOpen={open} onClose={onClose}>
      <ActionsheetBackdrop style={{ backgroundColor: '#000' }} />
      <ActionsheetContent
        style={{ backgroundColor: bg ?? p.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 0, paddingBottom: insets.bottom + 16, paddingHorizontal: 22, maxHeight, alignItems: 'stretch' }}
      >
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator style={{ backgroundColor: fg ?? p.faint, width: 44, height: 4 }} />
        </ActionsheetDragIndicatorWrapper>
        {scroll ? <ActionsheetScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>{children}</ActionsheetScrollView> : children}
      </ActionsheetContent>
    </Actionsheet>
  );
}
