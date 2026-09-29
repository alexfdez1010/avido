import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Book } from '@/lib/types';

import { jsonStorage } from './storage';

type LibraryState = {
  folderUri?: string;
  folderName?: string;
  books: Record<string, Book>;
  lastScanAt?: number;
  downloaded: Record<number, true>;
  markDownloaded: (id: number) => void;
  setFolder: (uri: string | undefined, name?: string) => void;
  replaceBooks: (books: Record<string, Book>) => void;
  updateBook: (id: string, patch: Partial<Book>) => void;
};

export const useLibrary = create<LibraryState>()(
  persist(
    (set) => ({
      books: {},
      downloaded: {},
      markDownloaded: (id) => set((s) => ({ downloaded: { ...s.downloaded, [id]: true } })),
      setFolder: (folderUri, folderName) => set({ folderUri, folderName }),
      replaceBooks: (books) => set({ books, lastScanAt: Date.now() }),
      updateBook: (id, patch) =>
        set((s) => (s.books[id] ? { books: { ...s.books, [id]: { ...s.books[id], ...patch } } } : s)),
    }),
    { name: 'avido.library', storage: jsonStorage, version: 1 }
  )
);

type ScanState = { scanning: boolean; message?: string; progress: number; set: (p: Partial<Omit<ScanState, 'set'>>) => void };

export const useScan = create<ScanState>()((set) => ({ scanning: false, progress: 0, set: (p) => set(p) }));
