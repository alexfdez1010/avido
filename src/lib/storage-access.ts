import { Directory } from 'expo-file-system';
import { startActivityAsync } from 'expo-intent-launcher';
import { PermissionsAndroid, Platform } from 'react-native';

export const STORAGE_ROOT = 'file:///storage/emulated/0';

const APP_PACKAGE = 'com.alexfdez.avido';

let legacyGranted = false;

/** Shared storage roots are listable without permission, so probe with a write that needs all-files access. */
export function hasStorageAccess(): boolean {
  if (Platform.OS !== 'android') return false;
  if (Platform.Version < 30) return legacyGranted;
  try {
    const root = new Directory(STORAGE_ROOT);
    const existing = new Directory(`${STORAGE_ROOT}/.avido-probe`);
    if (existing.exists) existing.delete();
    root.createDirectory('.avido-probe').delete();
    return true;
  } catch {
    return false;
  }
}

/** Requests broad read access to shared storage, used when the system folder picker is unusable. */
export async function requestStorageAccess(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (Platform.Version < 30) {
    const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    legacyGranted = res === PermissionsAndroid.RESULTS.GRANTED;
    return legacyGranted;
  }
  try {
    await startActivityAsync('android.settings.MANAGE_APP_ALL_FILES_ACCESS_PERMISSION', { data: `package:${APP_PACKAGE}` });
  } catch {
    await startActivityAsync('android.settings.MANAGE_ALL_FILES_ACCESS_PERMISSION').catch(() => {});
  }
  return hasStorageAccess();
}

export function listSubfolders(uri: string): Directory[] {
  try {
    return new Directory(uri)
      .list()
      .filter((e): e is Directory => e instanceof Directory && !e.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export function parentOf(uri: string): string | null {
  if (uri.replace(/\/$/, '') === STORAGE_ROOT) return null;
  return uri.replace(/\/$/, '').replace(/\/[^/]+$/, '');
}
