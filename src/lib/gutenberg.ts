import { Directory, File, Paths } from 'expo-file-system';

import { useLibrary } from '@/store/library';

import { findAll, localName, parseXml, textOf } from './html';
import { scanLibrary } from './library';

const SITE = 'https://www.gutenberg.org';

export type FreeBook = {
  id: number;
  title: string;
  author?: string;
  cover: string;
  epub: string;
};

export type FreePage = { books: FreeBook[]; next: string | null };

/** Builds a Project Gutenberg OPDS search URL sorted by popularity. */
export function catalogUrl({ search, language }: { search?: string; language?: string }): string {
  const query = [search?.trim(), language && `l.${language}`].filter(Boolean).join(' ');
  const q = query ? `&query=${encodeURIComponent(query)}` : '';
  return `${SITE}/ebooks/search.opds/?sort_order=downloads${q}`;
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*\([^)]*\)\s*$/, '')
    .split(/;\s|:\s/)[0]
    .trim();
}

export async function fetchCatalog(url: string, signal?: AbortSignal): Promise<FreePage> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/atom+xml' } });
  if (!res.ok) throw new Error(`Catalog request failed with ${res.status}`);
  const doc = parseXml(await res.text());
  const feed = findAll(doc, (n) => localName(n) === 'feed')[0];
  if (!feed) throw new Error('Unexpected catalog response');
  const children = feed.children ?? [];
  const books: FreeBook[] = [];
  for (const entry of children.filter((n) => localName(n) === 'entry')) {
    const fields = entry.children ?? [];
    const idText = textOf(fields.find((n) => localName(n) === 'id') ?? entry);
    const match = /\/ebooks\/(\d+)\.opds$/.exec(idText.trim());
    if (!match) continue;
    const id = Number(match[1]);
    const title = cleanTitle(textOf(fields.find((n) => localName(n) === 'title') ?? entry));
    const author = textOf(fields.find((n) => localName(n) === 'content') ?? { type: 'text', data: '' }).trim();
    books.push({
      id,
      title,
      author: author && !/^\d+ downloads?$/.test(author) ? author : undefined,
      cover: `${SITE}/cache/epub/${id}/pg${id}.cover.medium.jpg`,
      epub: `${SITE}/ebooks/${id}.epub3.images`,
    });
  }
  const nextHref = children.find((n) => localName(n) === 'link' && n.attribs?.rel === 'next')?.attribs?.href;
  return { books, next: nextHref ? (nextHref.startsWith('http') ? nextHref : `${SITE}${nextHref}`) : null };
}

function safeName(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90);
}

export function fileNameFor(book: FreeBook): string {
  const title = safeName(book.title);
  return book.author ? `${safeName(book.author)} - ${title}.epub` : `${title}.epub`;
}

/** Downloads the EPUB into the user's books folder and returns the library id of the new book. */
export async function downloadFreeBook(book: FreeBook): Promise<string | undefined> {
  const { folderUri } = useLibrary.getState();
  if (!folderUri) throw new Error('No books folder selected');
  const tmpDir = new Directory(Paths.cache, 'downloads');
  tmpDir.create({ idempotent: true, intermediates: true });
  const tmp = new File(tmpDir, `${book.id}.epub`);
  if (tmp.exists) tmp.delete();
  await File.downloadFileAsync(book.epub, tmp);
  try {
    const name = fileNameFor(book);
    const dir = new Directory(folderUri);
    const existing = dir.list().find((e) => e instanceof File && e.name === name);
    if (!existing) {
      const target = dir.createFile(name, 'application/epub+zip');
      target.write(await tmp.bytes());
    }
  } finally {
    tmp.delete();
  }
  useLibrary.getState().markDownloaded(book.id);
  await scanLibrary();
  const name = fileNameFor(book);
  return Object.values(useLibrary.getState().books).find((b) => b.fileName === name && !b.missing)?.id;
}
