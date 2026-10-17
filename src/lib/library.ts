import { Directory, File } from 'expo-file-system';
import { Alert } from 'react-native';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

import { useLibrary, useScan } from '@/store/library';

import { readEpubMeta } from './epub';
import { clearBookCache } from './paths';
import { hashString, hueFor } from './hash';
import type { Book, BookFormat } from './types';
import { tx } from '@/i18n';

const EXT: Record<string, BookFormat> = { epub: 'epub', pdf: 'pdf', txt: 'txt', md: 'md', markdown: 'md' };

export function formatOf(name: string): BookFormat | undefined {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXT[ext];
}

export function titleFromFileName(name: string): { title: string; author?: string } {
  const base = decodeURIComponent(name).replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = base.split(/\s+-\s+/);
  if (parts.length === 2) {
    const [a, b] = parts;
    return a.split(' ').length <= 4 ? { author: a, title: b } : { title: a, author: b };
  }
  return { title: base };
}

const MAX_SCAN_DEPTH = 8;

function collect(dir: Directory, depth: number, out: File[]) {
  let entries: (Directory | File)[] = [];
  try {
    entries = dir.list();
  } catch {
    if (depth === 0) throw new Error('Books folder is no longer accessible');
    return;
  }
  for (const e of entries) {
    if (e instanceof Directory) {
      if (depth < MAX_SCAN_DEPTH && !e.name.startsWith('.')) collect(e, depth + 1, out);
    } else if (formatOf(e.name ?? '')) {
      out.push(e);
    }
  }
}

export type PickResult = 'ok' | 'cancelled' | 'failed';

export function folderNameOf(uri: string): string {
  const decoded = decodeURIComponent(uri);
  return decoded.split(/[:/]/).filter(Boolean).pop() ?? tx('Libros', 'Books');
}

export function setBooksFolder(uri: string, name?: string) {
  useLibrary.getState().setFolder(uri, name ?? folderNameOf(uri));
  scanLibrary().catch(() => {});
}

export async function pickFolder(): Promise<PickResult> {
  let dir: Directory | null;
  try {
    dir = await Directory.pickDirectoryAsync(useLibrary.getState().folderUri);
  } catch (e) {
    const cancelled = e instanceof Error && /cancel/i.test(e.message);
    if (!cancelled) {
      console.warn('Folder picker failed', e);
      Alert.alert(
        tx('No se pudo abrir la carpeta', 'Could not open the folder'),
        tx('Vuelve a intentarlo y elige una carpeta con el selector del sistema. Solo se necesita acceso a esa carpeta.', 'Try again and choose a folder with the system picker. Only that folder needs access.')
      );
    }
    return cancelled ? 'cancelled' : 'failed';
  }
  if (!dir) return 'cancelled';
  setBooksFolder(dir.uri, folderNameOf(dir.uri) || dir.name);
  return 'ok';
}

let scanPromise: Promise<void> | null = null;

export function waitForLibraryScan(): Promise<void> {
  return scanPromise ?? Promise.resolve();
}

export function scanLibrary(): Promise<void> {
  if (!scanPromise) scanPromise = (async () => {
    let folder: string | undefined;
    do {
      folder = useLibrary.getState().folderUri;
      await doScan();
    } while (folder !== useLibrary.getState().folderUri);
  })().finally(() => (scanPromise = null));
  return scanPromise;
}

async function doScan() {
  const { folderUri, books: prev, replaceBooks } = useLibrary.getState();
  const scan = useScan.getState();
  if (!folderUri) return;
  scan.set({ scanning: true, progress: 0, message: tx('Buscando libros…', 'Looking for books…') });
  try {
    const files: File[] = [];
    collect(new Directory(folderUri), 0, files);
    const next: Record<string, Book> = {};
    for (const b of Object.values(prev)) {
      if (b.firstOpenedAt || b.finishedAt || b.progress || b.readSeconds || b.missing) next[b.id] = { ...b, missing: true };
    }
    const prevByUri = new Map(Object.values(prev).map((b) => [b.uri, b]));
    const restoredByFile = new Map<string, Book[]>();
    for (const b of Object.values(prev)) {
      if (!b.uri) {
        const key = `${b.fileName}:${b.size}`;
        restoredByFile.set(key, [...(restoredByFile.get(key) ?? []), b]);
      }
    }
    const foundUris = new Set(files.map((f) => f.uri));
    const claimed = new Set<string>();
    for (const f of files) {
      const name = f.name ?? f.uri;
      const format = formatOf(name)!;
      const size = f.size ?? 0;
      const fileId = await digestStringAsync(CryptoDigestAlgorithm.SHA256, `${name}:${size}`);
      // Keep legacy IDs so reader caches and finished-book references remain valid.
      const moved = prev[fileId] ?? prev[hashString(`${name}:${size}`)];
      const restored = restoredByFile.get(`${name}:${size}`) ?? [];
      const old =
        prevByUri.get(f.uri) ??
        (moved && moved.fileName === name && moved.size === size && !foundUris.has(moved.uri) && !claimed.has(moved.id) ? moved : undefined) ??
        (restored.length === 1 && !claimed.has(restored[0].id) ? restored[0] : undefined);
      if (old) claimed.add(old.id);
      const taken = (k: string) => next[k] && next[k].uri !== (old?.uri ?? f.uri);
      let id = old?.id ?? fileId;
      if (taken(id)) {
        id = await digestStringAsync(CryptoDigestAlgorithm.SHA256, `${f.uri}:${size}`);
        while (taken(id)) id += '~';
      }
      const guess = titleFromFileName(name);
      next[id] = old
        ? { ...old, uri: f.uri, fileName: name, missing: false }
        : {
            id,
            uri: f.uri,
            fileName: name,
            format,
            size,
            title: guess.title,
            author: guess.author,
            hue: hueFor(guess.title),
            addedAt: Date.now(),
            progress: 0,
            maxProgress: 0,
            readSeconds: 0,
            metaLoaded: format !== 'epub',
          };
    }
    if (useLibrary.getState().folderUri !== folderUri) return;
    // Hashing yields to the reader; retain progress saved while the scan ran.
    const latest = useLibrary.getState().books;
    for (const [id, book] of Object.entries(next)) {
      if (prev[id] && !latest[id]) { delete next[id]; continue; }
      if (latest[id]) next[id] = { ...latest[id], uri: book.uri, fileName: book.fileName, missing: book.missing };
    }
    replaceBooks(next);
    const pending = Object.values(next).filter((b) => !b.metaLoaded && !b.missing);
    for (let i = 0; i < pending.length; i++) {
      const b = pending[i];
      scan.set({ progress: (i + 1) / pending.length, message: `${tx('Leyendo portadas', 'Reading covers')} · ${i + 1}/${pending.length}` });
      try {
        const meta = await readEpubMeta(b.uri, b.id);
        useLibrary.getState().updateBook(b.id, {
          title: meta.title?.trim() || b.title,
          author: meta.author?.trim() || b.author,
          coverUri: meta.coverUri,
          hue: hueFor(meta.title || b.title),
          metaLoaded: true,
        });
      } catch (e) {
        useLibrary.getState().updateBook(b.id, { metaLoaded: true, error: String(e) });
      }
      await new Promise((r) => setTimeout(r, 0));
    }
  } finally {
    scan.set({ scanning: false, progress: 1, message: undefined });
  }
}

export function deleteBook(book: Book): boolean {
  try {
    const file = new File(book.uri);
    if (file.exists) file.delete();
  } catch (e) {
    if (!book.missing) {
      console.warn('Delete failed', e);
      return false;
    }
  }
  clearBookCache(book.id);
  useLibrary.getState().removeBook(book.id);
  return true;
}
