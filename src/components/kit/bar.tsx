import React from 'react';

import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { usePalette } from '@/hooks/use-palette';

export function Bar({ value, color, track, height = 6 }: { value: number; color?: string; track?: string; height?: number }) {
  const p = usePalette();
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <Progress value={v * 100} style={{ height, backgroundColor: track ?? p.line, borderRadius: height }}>
      <ProgressFilledTrack style={{ height, backgroundColor: color ?? p.ember, borderRadius: height }} />
    </Progress>
  );
}
