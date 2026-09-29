import { File } from 'expo-file-system';

import type { Block, BookContent, Chapter, Span } from './types';
import { CONTENT_VERSION } from './types';

const HEADING_RE =
  /^(cap[ií]tulo|chapter|parte|part|libro|book|pr[oó]logo|prologue|ep[ií]logo|epilogue|introducci[oó]n|introduction|acto|act|canto)\b[^\n]{0,80}$/i;
const ROMAN_RE = /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})\.?$/;

function decodeLatin1(bytes: Uint8Array): string {
  let out = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return out;
}

export async function readTextFile(uri: string): Promise<string> {
  const file = new File(uri);
  const text = await file.text();
  const bad = (text.slice(0, 200000).match(/\uFFFD/g) ?? []).length;
  if (bad > 3) return decodeLatin1(await file.bytes());
  return text;
}

function stripGutenberg(text: string): string {
  const start = text.search(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n/i);
  let body = text;
  if (start >= 0) body = body.slice(body.indexOf('\n', start) + 1);
  const end = body.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i);
  if (end >= 0) body = body.slice(0, end);
  return body;
}

function inlineMarkdown(text: string): Span[] {
  const spans: Span[] = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) spans.push({ t: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('**') || tok.startsWith('__')) spans.push({ t: tok.slice(2, -2), b: 1 });
    else spans.push({ t: tok.slice(1, -1), i: 1 });
    last = m.index + tok.length;
  }
  if (last < text.length) spans.push({ t: text.slice(last) });
  return spans.filter((s) => s.t.length > 0);
}

function block(k: Block['k'], text: string, md: boolean): Block {
  const s = md ? inlineMarkdown(text) : [{ t: text }];
  return { k, s, c: text.length };
}

export function parsePlainText(raw: string, markdown: boolean, fallbackTitle: string): BookContent {
  const text = stripGutenberg(raw.replace(/\r\n?/g, '\n')).replace(/\u00a0/g, ' ');
  const lines = text.split('\n');
  const blankRatio = lines.filter((l) => l.trim() === '').length / Math.max(1, lines.length);
  const paragraphs =
    blankRatio > 0.05
      ? text.split(/\n\s*\n+/)
      : lines;

  const chapters: Chapter[] = [];
  let current: Chapter = { title: '', blocks: [], chars: 0 };
  const push = () => {
    if (current.blocks.length) {
      current.chars = current.blocks.reduce((a, b) => a + b.c, 0);
      chapters.push(current);
    }
  };

  for (const para of paragraphs) {
    const clean = para.replace(/\s*\n\s*/g, ' ').replace(/[ \t]+/g, ' ').trim();
    if (!clean) continue;
    if (markdown) {
      const h = /^(#{1,6})\s+(.*)$/.exec(para.trim());
      if (h) {
        const level = h[1].length;
        if (level <= 2) {
          push();
          current = { title: h[2].trim(), blocks: [], chars: 0 };
        }
        current.blocks.push(block(level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3', h[2].trim(), true));
        continue;
      }
      if (/^(-{3,}|\*{3,})$/.test(clean)) {
        current.blocks.push({ k: 'hr', c: 0 });
        continue;
      }
      if (/^>\s?/.test(clean)) {
        current.blocks.push(block('q', clean.replace(/^>\s?/, ''), true));
        continue;
      }
      if (/^[-*+]\s+/.test(clean)) {
        for (const item of para.split('\n').filter((l) => l.trim()))
          current.blocks.push(block('li', item.replace(/^\s*[-*+]\s+/, '').trim(), true));
        continue;
      }
      current.blocks.push(block('p', clean, true));
      continue;
    }
    if (clean.length < 90 && (HEADING_RE.test(clean) || ROMAN_RE.test(clean))) {
      push();
      current = { title: clean, blocks: [block('h2', clean, false)], chars: 0 };
      continue;
    }
    if (/^[*\s]{3,}$/.test(clean)) {
      current.blocks.push({ k: 'hr', c: 0 });
      continue;
    }
    current.blocks.push(block('p', clean, false));
  }
  push();

  let result = chapters;
  if (result.length <= 1) {
    const all = result[0]?.blocks ?? [];
    result = [];
    const size = 80;
    for (let i = 0; i < all.length; i += size) {
      const blocks = all.slice(i, i + size);
      result.push({ title: `Parte ${result.length + 1}`, blocks, chars: blocks.reduce((a, b) => a + b.c, 0) });
    }
  }
  result.forEach((c, i) => {
    if (!c.title) c.title = i === 0 ? 'Inicio' : `Sección ${i + 1}`;
  });

  return {
    v: CONTENT_VERSION,
    title: fallbackTitle,
    chapters: result,
    totalChars: result.reduce((a, c) => a + c.chars, 0),
  };
}
