import { useSettings } from '@/store/settings';
import { palettes } from '@/theme/palette';

export function usePalette() {
  const mode = useSettings((s) => s.mode);
  return palettes[mode];
}
