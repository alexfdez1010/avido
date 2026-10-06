import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import type { OnLines, TextLine } from './block-view';

const SEGMENT_CHARS = 20000;

export type PagedItem = { key: string; chars: number };

type Box = { top: number; bottom: number };
type Page = { start: number; end: number };
type Measure = { y: number; h: number; laid?: boolean; offset?: number; lines?: TextLine[] };

type Props<T extends PagedItem> = {
  items: T[];
  renderItem: (item: T, index: number, onLines: OnLines) => React.ReactElement | null;
  initialIndex: number;
  startAtEnd?: boolean;
  bg: string;
  topPad: number;
  bottomPad: number;
  chrome: boolean;
  layoutKey: string;
  onPage: (first: number, last: number, atEnd: boolean) => void;
  onEdge: (dir: 1 | -1) => void;
  onToggle: () => void;
  onTurn?: () => void;
};

function segmentsOf(items: PagedItem[]): [number, number][] {
  const out: [number, number][] = [];
  let from = 0;
  let acc = 0;
  items.forEach((it, i) => {
    acc += it.chars;
    if (acc >= SEGMENT_CHARS && i < items.length - 1) {
      out.push([from, i + 1]);
      from = i + 1;
      acc = 0;
    }
  });
  out.push([from, items.length]);
  return out;
}

function paginate(boxes: Box[], height: number): Page[] {
  if (!boxes.length || height <= 0) return [{ start: 0, end: height }];
  const pages: Page[] = [];
  let start = Math.max(0, boxes[0].top);
  const last = boxes[boxes.length - 1].bottom;
  for (let guard = 0; guard < 5000; guard++) {
    const limit = start + height;
    const over = boxes.find((b) => b.bottom > limit + 0.5 && b.bottom > start);
    if (!over) {
      pages.push({ start, end: Math.max(start, last) });
      break;
    }
    const next = over.top > start + 0.5 ? over.top : limit;
    pages.push({ start, end: next });
    start = next;
  }
  return pages;
}

export function PagedView<T extends PagedItem>({ items, renderItem, initialIndex, startAtEnd, bg, topPad, bottomPad, chrome, layoutKey, onPage, onEdge, onToggle, onTurn }: Props<T>) {
  const segments = useMemo(() => segmentsOf(items), [items]);
  const initialSeg = useMemo(() => {
    if (startAtEnd) return segments.length - 1;
    const s = segments.findIndex(([a, b]) => initialIndex >= a && initialIndex < b);
    return s < 0 ? 0 : s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);
  const [seg, setSeg] = useState(initialSeg);
  const [from, to] = segments[Math.min(seg, segments.length - 1)];

  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(1);
  const [pages, setPages] = useState<Page[] | null>(null);
  const [page, setPage] = useState(0);
  const measures = useRef<Map<number, Measure>>(new Map());
  const anchor = useRef<{ index: number; dy: number } | 'end' | null>(startAtEnd ? 'end' : { index: initialIndex, dy: 0 });
  const scrollRef = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pagesRef = useRef<Page[] | null>(null);
  const pageRef = useRef(0);

  const compute = useCallback(() => {
    const m = measures.current;
    for (let i = from; i < to; i++) if (!m.get(i)?.laid) return;
    const boxes: Box[] = [];
    for (let i = from; i < to; i++) {
      const it = m.get(i)!;
      if (it.lines?.length) {
        const base = it.y + (it.offset ?? 0);
        for (const l of it.lines) boxes.push({ top: base + l.y, bottom: base + l.y + l.height });
      } else if (it.h > 0) boxes.push({ top: it.y, bottom: it.y + it.h });
    }
    boxes.sort((a, b) => a.top - b.top);
    const next = paginate(boxes, height);
    let target = 0;
    const a = anchor.current;
    if (a === 'end') target = next.length - 1;
    else if (a) {
      const mm = m.get(Math.max(from, Math.min(to - 1, a.index)));
      const y = (mm?.y ?? 0) + a.dy;
      next.forEach((p, i) => {
        if (p.start <= y + 1) target = i;
      });
    }
    pagesRef.current = next;
    setPages(next);
    setPage(target);
  }, [from, to, height]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(compute, 40);
  }, [compute]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    schedule();
  }, [height, layoutKey, schedule]);

  const indexAt = useCallback(
    (y: number) => {
      let found = from;
      for (let i = from; i < to; i++) {
        const mm = measures.current.get(i);
        if (mm && mm.y <= y + 0.5) found = i;
      }
      return found;
    },
    [from, to]
  );

  useLayoutEffect(() => {
    pageRef.current = page;
    const p = pages?.[page];
    if (!p) return;
    scrollRef.current?.scrollTo({ y: p.start, animated: false });
    const first = indexAt(p.start);
    const last = indexAt(Math.max(p.start, p.end - 1));
    const mm = measures.current.get(first);
    anchor.current = { index: first, dy: p.start - (mm?.y ?? 0) };
    onPage(first, last, seg === segments.length - 1 && page === pages.length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pages]);

  const turn = useCallback(
    (dir: 1 | -1) => {
      const ps = pagesRef.current;
      if (!ps) return;
      onTurn?.();
      const n = pageRef.current + dir;
      if (n >= 0 && n < ps.length) {
        setPage(n);
        return;
      }
      const ns = seg + dir;
      if (ns < 0 || ns >= segments.length) return onEdge(dir);
      measures.current = new Map();
      pagesRef.current = null;
      setPages(null);
      anchor.current = dir > 0 ? { index: segments[ns][0], dy: 0 } : 'end';
      setSeg(ns);
    },
    [onEdge, onTurn, seg, segments]
  );

  const handlers = useRef({ turn, onToggle, chrome, width });
  useLayoutEffect(() => {
    handlers.current = { turn, onToggle, chrome, width };
  });

  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .maxDuration(260)
      .maxDistance(10)
      .runOnJS(true)
      // eslint-disable-next-line react-hooks/refs -- gesture callback, runs outside render
      .onEnd((e) => {
        const h = handlers.current;
        if (h.chrome) return h.onToggle();
        if (e.x < h.width * 0.3) h.turn(-1);
        else if (e.x > h.width * 0.7) h.turn(1);
        else h.onToggle();
      });
    const pan = Gesture.Pan()
      .activeOffsetX([-24, 24])
      .failOffsetY([-24, 24])
      .runOnJS(true)
      // eslint-disable-next-line react-hooks/refs -- gesture callback, runs outside render
      .onEnd((e) => {
        const h = handlers.current;
        if (Math.abs(e.translationX) < 40) return;
        h.turn(e.translationX < 0 ? 1 : -1);
      });
    return Gesture.Race(pan, tap);
  }, []);

  const onWindow = useCallback((e: LayoutChangeEvent) => {
    setHeight(Math.floor(e.nativeEvent.layout.height));
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const current = pages?.[page];
  const mask = current ? Math.max(0, current.end - current.start) : 0;

  const onItemLayout = useCallback(
    (idx: number, y: number, h: number) => {
      const prev = measures.current.get(idx);
      measures.current.set(idx, { ...prev, y, h, laid: true });
      schedule();
    },
    [schedule]
  );
  const onItemLines = useCallback(
    (idx: number, offset: number, lines: TextLine[]) => {
      const prev = measures.current.get(idx) ?? { y: 0, h: 0 };
      measures.current.set(idx, { ...prev, offset, lines });
      schedule();
    },
    [schedule]
  );

  const children: React.ReactElement[] = [];
  for (let i = from; i < to; i++) {
    children.push(<Measured key={items[i].key} index={i} item={items[i]} renderItem={renderItem} onItemLayout={onItemLayout} onItemLines={onItemLines} />);
  }

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ flex: 1, paddingTop: topPad, paddingBottom: bottomPad, backgroundColor: bg }}>
        <View style={{ flex: 1, overflow: 'hidden' }} onLayout={onWindow}>
          <ScrollView
            key={`${seg}`}
            ref={scrollRef}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            style={{ opacity: pages ? 1 : 0 }}
          >
            {children}
            <View style={{ height: height + 2 }} />
          </ScrollView>
          {pages && mask < height && <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: mask, bottom: 0, backgroundColor: bg }} />}
        </View>
      </View>
    </GestureDetector>
  );
}

function Measured<T extends PagedItem>({
  index,
  item,
  renderItem,
  onItemLayout,
  onItemLines,
}: {
  index: number;
  item: T;
  renderItem: Props<T>['renderItem'];
  onItemLayout: (idx: number, y: number, h: number) => void;
  onItemLines: (idx: number, offset: number, lines: TextLine[]) => void;
}) {
  const onLines = useCallback<OnLines>((offset, lines) => onItemLines(index, offset, lines), [index, onItemLines]);
  return (
    <View collapsable={false} onLayout={(e) => onItemLayout(index, e.nativeEvent.layout.y, e.nativeEvent.layout.height)}>
      {renderItem(item, index, onLines)}
    </View>
  );
}
