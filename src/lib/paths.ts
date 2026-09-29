import { Directory, File, Paths } from 'expo-file-system';

export function bookDir(id: string): Directory {
  const dir = new Directory(Paths.document, 'books', id);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function contentFile(id: string): File {
  return new File(bookDir(id), 'content.json');
}

export function clearBookCache(id: string) {
  const dir = new Directory(Paths.document, 'books', id);
  if (dir.exists) dir.delete();
}
