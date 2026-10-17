import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File } from 'expo-file-system';

import { useGame } from '@/store/game';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { waitForLibraryScan } from './library';
import { backupFromState, decodeProgressBackup, encodeProgressBackup, restoreBooks, validateProgressBackup, type ProgressBackup } from './progress-backup';

export async function exportProgress(): Promise<boolean> {
  await waitForLibraryScan();
  const backup = backupFromState(useLibrary.getState().books, useGame.getState(), useSettings.getState());
  const raw = await encodeProgressBackup(backup);
  let directory: Directory;
  try {
    directory = await Directory.pickDirectoryAsync();
  } catch (error) {
    if (error instanceof Error && /cancel/i.test(error.message)) return false;
    throw error;
  }
  const file = directory.createFile(`avido-progress-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, 'application/json');
  try { file.write(raw); } catch (error) { if (file.exists) file.delete(); throw error; }
  return true;
}

export async function pickProgressBackup(): Promise<ProgressBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', 'application/octet-stream'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const file = new File(result.assets[0].uri);
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error('Backup too large');
    return await decodeProgressBackup(await file.text());
  } finally {
    if (file.exists) file.delete();
  }
}

export async function importProgress(input: ProgressBackup): Promise<void> {
  const backup = validateProgressBackup(input);
  await waitForLibraryScan();
  const { books, idMap } = restoreBooks(useLibrary.getState().books, backup.books);
  const game = { ...backup.game, lastReconciled: backup.game.lastReconciled,
    finished: backup.game.finished.map((b) => ({ ...b, id: idMap.get(b.id) ?? b.id })) };
  const library = { ...useLibrary.getState(), books };
  const settings = { ...useSettings.getState(), ...backup.profile };
  // Await durable storage before reporting success or updating the visible state.
  await AsyncStorage.multiSet([
    ['avido.library', JSON.stringify({ state: library, version: 1 })],
    ['avido.game', JSON.stringify({ state: game, version: 1 })],
    ['avido.settings', JSON.stringify({ state: settings, version: 1 })],
  ]);
  useLibrary.setState({ books });
  useGame.setState({ ...game, queue: [], hold: false });
  useSettings.setState(backup.profile);
}
