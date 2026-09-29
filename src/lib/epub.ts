import { File } from 'expo-file-system';
import JSZip from 'jszip';

import { findAll, htmlToBlocks, localName, parseXml, textOf } from './html';
import { bookDir } from './paths';
import type { BookContent, Chapter } from './types';
import { CONTENT_VERSION } from './types';
import { tx } from '@/i18n';

type ManifestItem = { id: string; href: string; type: string; props: string };

type Package = {
  zip: JSZip;
  opfDir: string;
  title?: string;
  author?: string;
  manifest: Map<string, ManifestItem>;
  spine: string[];
  tocId?: string;
  coverHref?: string;
};

function dirname(path: string) {
  const i = path.lastIndexOf('/');
  return i >= 0 ? path.slice(0, i + 1) : '';
}

export function resolvePath(base: string, rel: string): string {
  const clean = decodeURIComponent(rel.split('#')[0].split('?')[0]);
  if (clean.startsWith('/')) return clean.slice(1);
  const parts = (base + clean).split('/');
  const out: string[] = [];
  for (const p of parts) {
    if (p === '..') out.pop();
    else if (p !== '.' && p !== '') out.push(p);
  }
  return out.join('/');
}

function zipFile(zip: JSZip, path: string) {
  return zip.file(path) ?? zip.file(Object.keys(zip.files).find((k) => k.toLowerCase() === path.toLowerCase()) ?? '');
}

async function openPackage(uri: string): Promise<Package> {
  const bytes = await new File(uri).bytes();
  const zip = await JSZip.loadAsync(bytes);
  const container = await zipFile(zip, 'META-INF/container.xml')?.async('string');
  if (!container) throw new Error('EPUB sin container.xml');
  const rootfile = findAll(parseXml(container), (n) => localName(n) === 'rootfile')[0];
  const opfPath = rootfile?.attribs?.['full-path'];
  if (!opfPath) throw new Error('EPUB sin OPF');
  const opfXml = await zipFile(zip, opfPath)?.async('string');
  if (!opfXml) throw new Error('OPF ilegible');
  const opf = parseXml(opfXml);
  const opfDir = dirname(opfPath);

  const manifest = new Map<string, ManifestItem>();
  for (const item of findAll(opf, (n) => localName(n) === 'item')) {
    const a = item.attribs ?? {};
    if (!a.id || !a.href) continue;
    manifest.set(a.id, { id: a.id, href: resolvePath(opfDir, a.href), type: a['media-type'] ?? '', props: a.properties ?? '' });
  }
  const spineNode = findAll(opf, (n) => localName(n) === 'spine')[0];
  const spine = findAll(opf, (n) => localName(n) === 'itemref')
    .filter((n) => n.attribs?.linear !== 'no')
    .map((n) => n.attribs?.idref ?? '')
    .filter((id) => manifest.has(id));

  const title = findAll(opf, (n) => localName(n) === 'title' && (n.name ?? '').includes('dc'))[0];
  const creator = findAll(opf, (n) => localName(n) === 'creator')[0];

  let coverHref: string | undefined;
  for (const item of manifest.values()) if (item.props.includes('cover-image')) coverHref = item.href;
  if (!coverHref) {
    const meta = findAll(opf, (n) => localName(n) === 'meta' && n.attribs?.name === 'cover')[0];
    const id = meta?.attribs?.content;
    if (id && manifest.get(id)?.type.startsWith('image')) coverHref = manifest.get(id)?.href;
  }
  if (!coverHref) {
    for (const item of manifest.values())
      if (item.type.startsWith('image') && /cover/i.test(item.id + item.href)) {
        coverHref = item.href;
        break;
      }
  }

  return {
    zip,
    opfDir,
    title: title ? textOf(title).trim() : undefined,
    author: creator ? textOf(creator).trim() : undefined,
    manifest,
    spine,
    tocId: spineNode?.attribs?.toc,
    coverHref,
  };
}

async function writeCover(pkg: Package, id: string): Promise<string | undefined> {
  if (!pkg.coverHref) return undefined;
  const data = await zipFile(pkg.zip, pkg.coverHref)?.async('uint8array');
  if (!data) return undefined;
  const ext = pkg.coverHref.split('.').pop()?.toLowerCase() ?? 'jpg';
  const out = new File(bookDir(id), `cover.${ext}`);
  if (out.exists) out.delete();
  out.create();
  out.write(data);
  return out.uri;
}

export async function readEpubMeta(uri: string, id: string) {
  const pkg = await openPackage(uri);
  const coverUri = await writeCover(pkg, id).catch(() => undefined);
  return { title: pkg.title, author: pkg.author, coverUri };
}

async function tocTitles(pkg: Package): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  const navItem = [...pkg.manifest.values()].find((m) => m.props.split(' ').includes('nav'));
  const ncxItem = (pkg.tocId && pkg.manifest.get(pkg.tocId)) || [...pkg.manifest.values()].find((m) => m.type === 'application/x-dtbncx+xml');
  if (ncxItem) {
    const xml = await zipFile(pkg.zip, ncxItem.href)?.async('string');
    if (xml) {
      const base = dirname(ncxItem.href);
      for (const point of findAll(parseXml(xml), (n) => localName(n) === 'navpoint')) {
        const label = findAll(point, (n) => localName(n) === 'text')[0];
        const content = findAll(point, (n) => localName(n) === 'content')[0];
        const src = content?.attribs?.src;
        if (label && src) {
          const key = resolvePath(base, src);
          if (!titles.has(key)) titles.set(key, textOf(label).trim());
        }
      }
    }
  }
  if (titles.size === 0 && navItem) {
    const xml = await zipFile(pkg.zip, navItem.href)?.async('string');
    if (xml) {
      const base = dirname(navItem.href);
      for (const a of findAll(parseXml(xml), (n) => localName(n) === 'a')) {
        const href = a.attribs?.href;
        if (href) {
          const key = resolvePath(base, href);
          if (!titles.has(key)) titles.set(key, textOf(a).replace(/\s+/g, ' ').trim());
        }
      }
    }
  }
  return titles;
}

export async function parseEpub(uri: string, id: string, onProgress?: (p: number) => void): Promise<BookContent> {
  const pkg = await openPackage(uri);
  const titles = await tocTitles(pkg);
  const imgDir = bookDir(id);
  const written = new Map<string, string>();
  let imgCount = 0;
  const chapters: Chapter[] = [];

  for (let i = 0; i < pkg.spine.length; i++) {
    const item = pkg.manifest.get(pkg.spine[i]);
    if (!item) continue;
    const html = await zipFile(pkg.zip, item.href)?.async('string');
    if (!html) continue;
    const base = dirname(item.href);
    const pending: { path: string; out: File }[] = [];
    const blocks = htmlToBlocks(html, (src) => {
      if (src.startsWith('data:') || /^https?:/.test(src)) return undefined;
      const path = resolvePath(base, src);
      const existing = written.get(path);
      if (existing) return existing;
      if (!zipFile(pkg.zip, path) || imgCount > 400) return undefined;
      const ext = path.split('.').pop()?.toLowerCase() ?? 'img';
      const out = new File(imgDir, `img-${imgCount++}.${ext}`);
      written.set(path, out.uri);
      pending.push({ path, out });
      return out.uri;
    });
    for (const p of pending) {
      const data = await zipFile(pkg.zip, p.path)?.async('uint8array');
      if (!data) continue;
      if (p.out.exists) p.out.delete();
      p.out.create();
      p.out.write(data);
    }
    if (blocks.length === 0) continue;
    const firstHeading = blocks.find((b) => b.k === 'h1' || b.k === 'h2' || b.k === 'h3');
    const title =
      titles.get(item.href) ||
      (firstHeading?.s ? firstHeading.s.map((s) => s.t).join('').replace(/\s+/g, ' ').trim() : '') ||
      `${tx('Sección', 'Section')} ${chapters.length + 1}`;
    chapters.push({ title: title.slice(0, 120), blocks, chars: blocks.reduce((a, b) => a + b.c, 0) });
    onProgress?.((i + 1) / pkg.spine.length);
    await new Promise((r) => setTimeout(r, 0));
  }

  return {
    v: CONTENT_VERSION,
    title: pkg.title ?? '',
    author: pkg.author,
    chapters,
    totalChars: chapters.reduce((a, c) => a + c.chars, 0),
  };
}
