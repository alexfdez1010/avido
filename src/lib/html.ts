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

const MONO = new Set(['code', 'kbd', 'samp', 'tt']);
const CODE_CLASS = /(^|[\s_-])(code|programlisting|screen|listing|sourcecode|codeblock|pre)(\d*)(?=[\s_-]|$)/i;
const RAW_WS = /white-space\s*:\s*(pre|break-spaces)/i;

type RawSpan = Span & { raw?: boolean };

const sameStyle = (a: Span, b: Span) => a.i === b.i && a.b === b.b && a.m === b.m;

function mergeSpans(spans: Span[]): Span[] {
  const out: Span[] = [];
  for (const s of spans) {
    const last = out[out.length - 1];
    if (last && sameStyle(last, s)) last.t += s.t;
    else out.push({ ...s });
  }
  return out;
}

const textOfSpans = (spans: Span[]) => spans.map((s) => s.t).join('');

function codeLines(spans: RawSpan[]): Span[][] {
  const lines: Span[][] = [[]];
  for (const s of spans) {
    s.t
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .forEach((part, idx) => {
        if (idx > 0) lines.push([]);
        const line = lines[lines.length - 1];
        let t = part;
        if (!s.raw && line.length === 0) t = t.replace(/^[ \t]+/, '');
        t = t.replace(/\t/g, '    ').replace(/\u00a0/g, ' ');
        if (t) line.push({ t, ...(s.b ? { b: 1 as const } : {}) });
      });
  }
  for (const line of lines) {
    const last = line[line.length - 1];
    if (last) last.t = last.t.replace(/\s+$/, '');
  }
  const blank = (l: Span[]) => textOfSpans(l).trim() === '';
  while (lines.length && blank(lines[0])) lines.shift();
  while (lines.length && blank(lines[lines.length - 1])) lines.pop();
  return lines;
}

function joinLines(lines: Span[][]): Span[] {
  const out: Span[] = [];
  lines.forEach((line, idx) => {
    if (idx > 0) out.push({ t: '\n' });
    out.push(...line);
  });
  return mergeSpans(out).filter((s) => s.t.length > 0);
}

function dedent(spans: Span[]): Span[] {
  const lines: Span[][] = [[]];
  for (const s of spans) {
    s.t.split('\n').forEach((part, idx) => {
      if (idx > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ ...s, t: part });
    });
  }
  const indents = lines.map(textOfSpans).filter((t) => t.trim()).map((t) => /^ */.exec(t)![0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  if (cut === 0) return spans;
  const out = lines.map((line) => {
    let left = cut;
    const kept: Span[] = [];
    for (const s of line) {
      const n = Math.min(left, /^ */.exec(s.t)![0].length);
      const t = s.t.slice(n);
      left = t.length > 0 ? 0 : left - n;
      if (t) kept.push({ ...s, t });
    }
    return kept;
  });
  return joinLines(out);
}

const CODE_CHARS = /[{}<>=;|\\$#`~^]/g;

// Converters like Pandoc turn indented prose (typically block quotes) into <pre><code>.
function looksLikeProse(text: string): boolean {
  const body = text.replace(/\s+/g, '');
  if (body.length < 80) return false;
  const letters = (body.match(/\p{L}/gu) ?? []).length;
  const code = (body.match(CODE_CHARS) ?? []).length;
  const lines = text.split('\n').filter((l) => l.trim());
  const words = text.split(/\s+/).filter(Boolean).length;
  const stops = (text.match(/[,.;:!?…]["”»)]?(\s|$)/g) ?? []).length;
  const flags = /(^|\s)(--[a-z]|-[a-z](\s|$))/i.test(text);
  return !flags && letters / body.length > 0.85 && code / body.length < 0.005 && words / lines.length >= 6 && stops >= Math.max(2, words / 40);
}

function proseQuotes(spans: Span[]): Block[] {
  const out: Block[] = [];
  let cur: Span[] = [];
  const push = () => {
    const s = mergeSpans(cur.map((x) => ({ ...x, t: x.t.replace(/\s+/g, ' ') }))).filter((x) => x.t);
    if (s.length) {
      s[0].t = s[0].t.trimStart();
      s[s.length - 1].t = s[s.length - 1].t.trimEnd();
      const c = s.reduce((a, x) => a + x.t.length, 0);
      if (c) out.push({ k: 'q', s, c });
    }
    cur = [];
  };
  for (const span of spans) {
    span.t.split(/\n[ \t]*\n/).forEach((part, idx) => {
      if (idx > 0) push();
      if (part) cur.push({ ...span, t: part });
    });
  }
  push();
  return out;
}

export function htmlToBlocks(html: string, resolveImage: ImageResolver): Block[] {
  const doc = parseDocument(html, { decodeEntities: true, lowerCaseTags: true }) as unknown as Node;
  const blocks: Block[] = [];
  let spans: RawSpan[] = [];
  const style = { i: 0, b: 0, m: 0 };

  // Code listings split over sibling elements (one <p class="code"> per line) are joined
  // back into one block: `true` always joins, a string joins only with the same source.
  type Join = boolean | string;
  let codeKey: string | undefined;
  let blankLines = 0;

  const pushBlock = (kind: BlockKind, s: Span[], join: Join) => {
    const chars = s.reduce((a, x) => a + x.t.length, 0);
    const last = blocks[blocks.length - 1];
    const joins = kind === 'pre' && last?.k === 'pre' && !!last.s && (join === true || (!!join && join === codeKey));
    if (chars === 0) {
      if (joins && kind === 'pre') blankLines++;
      return;
    }
    if (joins && last.s) {
      const gap = '\n'.repeat(1 + blankLines);
      last.s = mergeSpans([...last.s, { t: gap }, ...s]);
      last.c += chars + gap.length;
    } else {
      blocks.push({ k: kind, s, c: chars });
      codeKey = undefined;
    }
    blankLines = 0;
    if (kind === 'pre' && typeof join === 'string') codeKey = join;
  };

  const flush = (kind: BlockKind, join: Join = false) => {
    if (spans.length === 0) {
      if (kind === 'pre') pushBlock('pre', [], join);
      return;
    }
    const visible = spans.filter((s) => s.t.trim());
    if (kind === 'p' && visible.length > 0 && visible.every((s) => s.m)) {
      kind = 'pre';
      join = 'mono';
    }
    if (kind === 'pre') {
      pushBlock('pre', joinLines(codeLines(spans)), join);
      spans = [];
      return;
    }
    const merged = mergeSpans(spans.map(({ raw: _raw, ...s }) => s));
    if (merged.length) {
      merged[0].t = merged[0].t.replace(/^\s+/, '');
      const lastSpan = merged[merged.length - 1];
      lastSpan.t = lastSpan.t.replace(/\s+$/, '');
    }
    const clean = merged
      .map((s) => ({ ...s, t: s.t.replace(/[ \t]*\n[ \t]*/g, '\n') }))
      .filter((s) => s.t.length > 0);
    pushBlock(kind, clean, false);
    spans = [];
  };

  const pushText = (t: string, pre: boolean) => {
    const text = pre ? t : t.replace(/[ \t\n\r\f]+/g, ' ');
    if (!text) return;
    const span: RawSpan = { t: text };
    if (style.i > 0) span.i = 1;
    if (style.b > 0) span.b = 1;
    if (style.m > 0) span.m = 1;
    if (pre) span.raw = true;
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
      spans.push({ t: '\n', raw: true });
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
    const rawWs = name === 'pre' || RAW_WS.test(n.attribs?.style ?? '');
    const blockKind = BLOCK_KIND[name];
    if (blockKind) {
      const isCode = blockKind === 'pre' || (blockKind === 'p' && (rawWs || CODE_CLASS.test(n.attribs?.class ?? '')));
      const inCode = kind === 'pre';
      flush(kind, inCode);
      const start = blocks.length;
      const inner: BlockKind = isCode ? 'pre' : blockKind === 'p' && kind !== 'p' ? kind : blockKind;
      n.children?.forEach((c) => walk(c, inner, pre || rawWs));
      const key = isCode && name !== 'pre' ? `${name}.${n.attribs?.class ?? ''}` : false;
      flush(inner, inCode || blocks.length > start || key);
      return;
    }
    const isItalic = name === 'em' || name === 'i' || name === 'cite' || name === 'var';
    const isBold = name === 'strong' || name === 'b';
    const isMono = MONO.has(name);
    if (isItalic) style.i++;
    if (isBold) style.b++;
    if (isMono) style.m++;
    n.children?.forEach((c) => walk(c, kind, pre || rawWs));
    if (isItalic) style.i--;
    if (isBold) style.b--;
    if (isMono) style.m--;
  };

  walk(doc, 'p', false);
  flush('p');
  return blocks.flatMap((b) => {
    if (b.k !== 'pre' || !b.s) return [b];
    if (looksLikeProse(textOfSpans(b.s))) return proseQuotes(b.s);
    b.s = dedent(b.s);
    b.c = b.s.reduce((a, x) => a + x.t.length, 0);
    return [b];
  });
}
