import { parseDocument } from 'htmlparser2';

import type { Block, BlockKind, Span } from './types';

type Node = {
  type: string;
  name?: string;
  data?: string;
  attribs?: Record<string, string>;
  children?: Node[];
};

const SKIP = new Set(['head', 'script', 'style', 'title', 'meta', 'link', 'svg:title', 'nav', 'noscript']);
const BLOCK_KIND: Record<string, BlockKind> = {
  p: 'p',
  div: 'p',
  section: 'p',
  article: 'p',
  body: 'p',
  header: 'p',
  footer: 'p',
  aside: 'p',
  figure: 'p',
  figcaption: 'p',
  dd: 'p',
  dt: 'p',
  td: 'p',
  th: 'p',
  tr: 'p',
  table: 'p',
  center: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h3',
  h5: 'h3',
  h6: 'h3',
  blockquote: 'q',
  li: 'li',
  pre: 'pre',
};

export function parseXml(xml: string): Node {
  return parseDocument(xml, { xmlMode: true, decodeEntities: true }) as unknown as Node;
}

export function findAll(node: Node, pred: (n: Node) => boolean, out: Node[] = []): Node[] {
  if (pred(node)) out.push(node);
  node.children?.forEach((c) => findAll(c, pred, out));
  return out;
}

export function localName(n: Node): string {
  const name = (n.name ?? '').toLowerCase();
  const idx = name.indexOf(':');
  return idx >= 0 ? name.slice(idx + 1) : name;
}

export function textOf(n: Node): string {
  if (n.type === 'text') return n.data ?? '';
  return (n.children ?? []).map(textOf).join('');
}

export type ImageResolver = (src: string) => string | undefined;

export function htmlToBlocks(html: string, resolveImage: ImageResolver): Block[] {
  const doc = parseDocument(html, { decodeEntities: true, lowerCaseTags: true }) as unknown as Node;
  const blocks: Block[] = [];
  let spans: Span[] = [];
  const style = { i: 0, b: 0 };

  const flush = (kind: BlockKind) => {
    if (spans.length === 0) return;
    const merged: Span[] = [];
    for (const s of spans) {
      const last = merged[merged.length - 1];
      if (last && last.i === s.i && last.b === s.b) last.t += s.t;
      else merged.push({ ...s });
    }
    if (merged.length) {
      merged[0].t = merged[0].t.replace(/^\s+/, '');
      const lastSpan = merged[merged.length - 1];
      lastSpan.t = lastSpan.t.replace(/\s+$/, '');
    }
    const clean = merged
      .map((s) => ({ ...s, t: s.t.replace(/[ \t]*\n[ \t]*/g, '\n') }))
      .filter((s) => s.t.length > 0);
    const chars = clean.reduce((a, s) => a + s.t.length, 0);
    if (chars > 0) blocks.push({ k: kind, s: clean, c: chars });
    spans = [];
  };

  const pushText = (t: string, pre: boolean) => {
    const text = pre ? t : t.replace(/\s+/g, ' ');
    if (!text) return;
    const span: Span = { t: text };
    if (style.i > 0) span.i = 1;
    if (style.b > 0) span.b = 1;
    spans.push(span);
  };

  const walk = (n: Node, kind: BlockKind, pre: boolean) => {
    if (n.type === 'text') {
      pushText(n.data ?? '', pre);
      return;
    }
    if (n.type !== 'tag' && n.type !== 'root') {
      n.children?.forEach((c) => walk(c, kind, pre));
      return;
    }
    const name = localName(n);
    if (SKIP.has(name)) return;
    if (name === 'br') {
      spans.push({ t: '\n' });
      return;
    }
    if (name === 'hr') {
      flush(kind);
      blocks.push({ k: 'hr', c: 0 });
      return;
    }
    if (name === 'img' || name === 'image') {
      const src = n.attribs?.src ?? n.attribs?.['xlink:href'] ?? n.attribs?.href;
      const resolved = src ? resolveImage(src) : undefined;
      if (resolved) {
        flush(kind);
        blocks.push({ k: 'img', src: resolved, c: 200 });
      }
      return;
    }
    const blockKind = BLOCK_KIND[name];
    const isItalic = name === 'em' || name === 'i' || name === 'cite' || name === 'var';
    const isBold = name === 'strong' || name === 'b';
    if (blockKind) {
      flush(kind);
      const inner: BlockKind = blockKind === 'p' && kind !== 'p' ? kind : blockKind;
      n.children?.forEach((c) => walk(c, inner, pre || name === 'pre'));
      flush(inner);
      return;
    }
    if (isItalic) style.i++;
    if (isBold) style.b++;
    n.children?.forEach((c) => walk(c, kind, pre));
    if (isItalic) style.i--;
    if (isBold) style.b--;
  };

  walk(doc, 'p', false);
  flush('p');
  return blocks;
}
