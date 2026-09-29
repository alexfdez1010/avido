import { Directory, File } from 'expo-file-system';

import { useLibrary, useScan } from '@/store/library';

import { readEpubMeta } from './epub';
import { hashString, hueFor } from './hash';
import type { Book, BookFormat } from './types';
import { tx } from '@/i18n';
import { openFolderBrowser } from '@/store/folder-browser';

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

function collect(dir: Directory, depth: number, out: File[]) {
  let entries: (Directory | File)[] = [];
  try {
    entries = dir.list();
  } catch {
    return;
  }
  for (const e of entries) {
    if (e instanceof Directory) {
      if (depth < 4 && !e.name.startsWith('.')) collect(e, depth + 1, out);
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
      openFolderBrowser();
    }
    return cancelled ? 'cancelled' : 'failed';
  }
  if (!dir) return 'cancelled';
  setBooksFolder(dir.uri, folderNameOf(dir.uri) || dir.name);
  return 'ok';
}

let scanPromise: Promise<void> | null = null;

export function scanLibrary(): Promise<void> {
  if (!scanPromise) scanPromise = doScan().finally(() => (scanPromise = null));
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
      if (b.firstOpenedAt || b.finishedAt) next[b.id] = { ...b, missing: true };
    }
    files.forEach((f) => {
      const name = f.name ?? f.uri;
      const format = formatOf(name)!;
      const size = f.size ?? 0;
      const id = hashString(`${name}:${size}`);
      const old = prev[id];
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
    });
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
