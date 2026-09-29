import { useSettings } from '@/store/settings';
import { einkPalette, palettes } from '@/theme/palette';

export function usePalette() {
  const mode = useSettings((s) => s.mode);
  const eink = useSettings((s) => s.eink);
  return eink ? einkPalette : palettes[mode];
}
