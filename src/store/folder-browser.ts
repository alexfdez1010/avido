import { create } from 'zustand';

export const useFolderBrowser = create<{ open: boolean; set: (open: boolean) => void }>()((set) => ({
  open: false,
  set: (open) => set({ open }),
}));

export const openFolderBrowser = () => useFolderBrowser.getState().set(true);
