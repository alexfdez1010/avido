import { File } from 'expo-file-system';

import { parseEpub } from './epub';
import { contentFile } from './paths';
import { parsePlainText, readTextFile } from './plaintext';
import type { Book, BookContent } from './types';
import { CONTENT_VERSION } from './types';
import { tx } from '@/i18n';

const memory = new Map<string, BookContent>();

export async function loadContent(book: Book, onProgress?: (p: number) => void): Promise<BookContent> {
  const hit = memory.get(book.id);
  if (hit) return hit;
  const cache = contentFile(book.id);
  if (cache.exists) {
    try {
      const parsed = JSON.parse(await cache.text()) as BookContent;
      if (parsed.v === CONTENT_VERSION && parsed.chapters.length) {
        memory.set(book.id, parsed);
        return parsed;
      }
    } catch {}
  }
  let content: BookContent;
  if (book.format === 'epub') content = await parseEpub(book.uri, book.id, onProgress);
  else content = parsePlainText(await readTextFile(book.uri), book.format === 'md', book.title);
  if (!content.chapters.length) throw new Error(tx('El libro está vacío o no se pudo leer.', 'The book is empty or could not be read.'));
  try {
    const out = new File(contentFile(book.id).uri);
    if (out.exists) out.delete();
    out.create();
    out.write(JSON.stringify(content));
  } catch {}
  memory.clear();
  memory.set(book.id, content);
  return content;
}
