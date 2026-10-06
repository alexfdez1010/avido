import { requireOptionalNativeModule } from 'expo';

type EventSubscription = { remove(): void };

type VolumeKeysModule = {
  setEnabled(on: boolean): void;
  addListener(event: 'onVolumeKey', listener: (e: { dir: 1 | -1 }) => void): EventSubscription;
};

const native = requireOptionalNativeModule<VolumeKeysModule>('VolumeKeys');

/** Captures the hardware volume keys while enabled: down = 1 (forward), up = -1 (back). */
export function captureVolumeKeys(onKey: (dir: 1 | -1) => void): () => void {
  if (!native) return () => {};
  native.setEnabled(true);
  const sub = native.addListener('onVolumeKey', (e) => onKey(e.dir));
  return () => {
    sub.remove();
    native.setEnabled(false);
  };
}
