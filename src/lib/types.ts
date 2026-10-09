export type BookFormat = 'epub' | 'pdf' | 'txt' | 'md';

export type BookLocation = { chapter: number; block: number };

export type Book = {
  id: string;
  uri: string;
  fileName: string;
  format: BookFormat;
  size: number;
  title: string;
  author?: string;
  coverUri?: string;
  hue: number;
  addedAt: number;
  firstOpenedAt?: number;
  lastOpenedAt?: number;
  finishedAt?: number;
  progress: number;
  maxProgress: number;
  location?: BookLocation;
  pdfPage?: number;
  pdfPages?: number;
  totalChars?: number;
  readSeconds: number;
  readPages?: number;
  metaLoaded: boolean;
  missing?: boolean;
  error?: string;
};

export type Span = { t: string; i?: 1; b?: 1; m?: 1 };

export type BlockKind = 'p' | 'h1' | 'h2' | 'h3' | 'q' | 'li' | 'hr' | 'img' | 'pre';

export type Block = {
  k: BlockKind;
  s?: Span[];
  src?: string;
  c: number;
};

export type Chapter = { title: string; blocks: Block[]; chars: number };

export type BookContent = {
  v: number;
  title: string;
  author?: string;
  chapters: Chapter[];
  totalChars: number;
};

export const CONTENT_VERSION = 5;
export const FINISH_THRESHOLD = 0.8;

export const CHARS_PER_PAGE = 1500;
