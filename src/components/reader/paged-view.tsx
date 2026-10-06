import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { LinearGradient } from 'expo-linear-gradient';

import type { OnLines, TextLine } from './block-view';

const SEGMENT_CHARS = 20000;
const SHADOW = 28;
const DIM = 0.14;
const noLines: OnLines = () => {};
const ease = Easing.out(Easing.cubic);

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
  animate: boolean;
  turnRef?: React.RefObject<((dir: 1 | -1) => void) | null>;
  canPrev: boolean;
  canNext: boolean;
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

export function PagedView<T extends PagedItem>({ items, renderItem, initialIndex, startAtEnd, bg, topPad, bottomPad, chrome, layoutKey, onPage, onEdge, onToggle, onTurn, animate, canPrev, canNext, turnRef }: Props<T>) {
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
  const [peekPage, setPeekPage] = useState<number | null>(null);
  const [peekAbove, setPeekAbove] = useState(false);
  const measures = useRef<Map<number, Measure>>(new Map());
  const anchor = useRef<{ index: number; dy: number } | 'end' | null>(startAtEnd ? 'end' : { index: initialIndex, dy: 0 });
  const scrollRef = useRef<ScrollView>(null);
  const peekRef = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pagesRef = useRef<Page[] | null>(null);
  const pageRef = useRef(0);
  const resetPending = useRef(false);

  const progress = useSharedValue(0);
  const dirSV = useSharedValue(0);
  const owned = useSharedValue(false);
  const pending = useSharedValue(false);
  const widthSV = useSharedValue(1);

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

  const showPeek = useCallback((n: number) => {
    const ps = pagesRef.current;
    if (ps && n >= 0 && n < ps.length) {
      peekRef.current?.scrollTo({ y: ps[n].start, animated: false });
      setPeekPage(n);
      return true;
    }
    setPeekPage(null);
    return false;
  }, []);

  const reset = useCallback(() => {
    resetPending.current = false;
    progress.set(0);
    dirSV.set(0);
    setPeekAbove(false);
    requestAnimationFrame(() => showPeek(pageRef.current + 1));
  }, [dirSV, progress, showPeek]);

  useLayoutEffect(() => {
    pageRef.current = page;
    const p = pages?.[page];
    if (!p) return;
    scrollRef.current?.scrollTo({ y: p.start, animated: false });
    if (resetPending.current) requestAnimationFrame(() => requestAnimationFrame(reset));
    else showPeek(page + 1);
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

  const prepare = useCallback(
    (dir: 1 | -1) => {
      const ps = pagesRef.current;
      const n = pageRef.current + dir;
      const inside = !!ps && n >= 0 && n < ps.length;
      const more = dir > 0 ? seg < segments.length - 1 || canNext : seg > 0 || canPrev;
      if (!ps || (!inside && !more)) {
        dirSV.set(0);
        progress.set(0);
        return false;
      }
      onTurn?.();
      if (dir < 0 || peekPage !== n) showPeek(n);
      setPeekAbove(dir < 0);
      return true;
    },
    [canNext, canPrev, dirSV, onTurn, peekPage, progress, seg, segments.length, showPeek]
  );

  const finish = useCallback(
    (dir: 1 | -1) => {
      resetPending.current = true;
      turn(dir);
      setTimeout(() => resetPending.current && reset(), 900);
    },
    [reset, turn]
  );

  const cancel = useCallback(() => {
    dirSV.set(0);
    setPeekAbove(false);
    showPeek(pageRef.current + 1);
  }, [dirSV, showPeek]);

  const animatedTurn = useCallback(
    (dir: 1 | -1) => {
      if (dirSV.get() !== 0) return;
      dirSV.set(dir);
      progress.set(0);
      if (!prepare(dir)) return;
      progress.set(withTiming(1, { duration: 300, easing: ease }, (done) => {
        if (done) scheduleOnRN(finish, dir);
      }));
    },
    [dirSV, finish, prepare, progress]
  );

  const handlers = useRef({ turn, animatedTurn, prepare, finish, cancel, onToggle, chrome, width });
  useLayoutEffect(() => {
    handlers.current = { turn, animatedTurn, prepare, finish, cancel, onToggle, chrome, width };
  });
  useLayoutEffect(() => {
    if (!turnRef) return;
    turnRef.current = (dir) => (animate ? handlers.current.animatedTurn(dir) : handlers.current.turn(dir));
    return () => {
      turnRef.current = null;
    };
  }, [animate, turnRef]);

  const gesture = useMemo(() => {
    /* eslint-disable react-hooks/refs -- gesture callbacks run outside render */
    const jsPrepare = (dir: 1 | -1) => handlers.current.prepare(dir);
    const jsFinish = (dir: 1 | -1) => handlers.current.finish(dir);
    const jsCancel = () => handlers.current.cancel();
    const jsTurn = (dir: 1 | -1) => (animate ? handlers.current.animatedTurn(dir) : handlers.current.turn(dir));
    const tap = Gesture.Tap()
      .maxDuration(260)
      .maxDistance(10)
      .runOnJS(true)
      .onEnd((e) => {
        const h = handlers.current;
        if (h.chrome) return h.onToggle();
        if (e.x < h.width * 0.3) jsTurn(-1);
        else if (e.x > h.width * 0.7) jsTurn(1);
        else h.onToggle();
      });
    if (!animate) {
      const pan = Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-24, 24])
        .runOnJS(true)
        .onEnd((e) => {
          if (Math.abs(e.translationX) < 40) return;
          handlers.current.turn(e.translationX < 0 ? 1 : -1);
        });
      return Gesture.Race(pan, tap);
    }
    /* eslint-enable react-hooks/refs */
    const pan = Gesture.Pan()
      .activeOffsetX([-12, 12])
      .failOffsetY([-24, 24])
      .onStart(() => {
        owned.set(dirSV.get() === 0);
        pending.set(true);
      })
      // eslint-disable-next-line react-hooks/refs -- gesture callback, runs outside render
      .onUpdate((e) => {
        if (!owned.get()) return;
        if (pending.get()) {
          if (Math.abs(e.translationX) < 1) return;
          pending.set(false);
          const dir = e.translationX < 0 ? 1 : -1;
          dirSV.set(dir);
          progress.set(0);
          scheduleOnRN(jsPrepare, dir);
          return;
        }
        if (dirSV.get() === 0) return;
        const p = (dirSV.get() === 1 ? -e.translationX : e.translationX) / widthSV.get();
        progress.set(Math.min(1, Math.max(0, p)));
      })
      // eslint-disable-next-line react-hooks/refs -- gesture callback, runs outside render
      .onFinalize((e) => {
        if (!owned.get()) return;
        owned.set(false);
        pending.set(false);
        const dir = dirSV.get() as 1 | -1 | 0;
        if (dir === 0) return;
        const v = dir === 1 ? -e.velocityX : e.velocityX;
        const done = v > 400 || (progress.get() > 0.3 && v > -300);
        const remaining = done ? 1 - progress.get() : progress.get();
        progress.set(withTiming(done ? 1 : 0, { duration: 120 + 220 * remaining, easing: ease }, (ok) => {
          if (!ok) return;
          if (done) scheduleOnRN(jsFinish, dir);
          else scheduleOnRN(jsCancel);
        }));
      });
    return Gesture.Race(pan, tap);
  }, [animate, dirSV, owned, pending, progress, widthSV]);

  const onWindow = useCallback(
    (e: LayoutChangeEvent) => {
      setHeight(Math.floor(e.nativeEvent.layout.height));
    },
    []
  );
  const onFrame = useCallback(
    (e: LayoutChangeEvent) => {
      setWidth(e.nativeEvent.layout.width);
      widthSV.set(e.nativeEvent.layout.width);
    },
    [widthSV]
  );

  const currentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dirSV.get() === 1 ? -progress.get() * widthSV.get() : 0 }],
  }));
  const peekStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dirSV.get() === -1 ? -(1 - progress.get()) * widthSV.get() : 0 }],
  }));
  const currentDim = useAnimatedStyle(() => ({ opacity: dirSV.get() === -1 ? (1 - progress.get()) * DIM : 0 }));
  const peekDim = useAnimatedStyle(() => ({ opacity: dirSV.get() === 1 ? (1 - progress.get()) * DIM : 0 }));
  const currentShadow = useAnimatedStyle(() => ({ opacity: dirSV.get() === 1 ? Math.min(1, progress.get() * 6) * (1 - progress.get() * 0.6) : 0 }));
  const peekShadow = useAnimatedStyle(() => ({ opacity: dirSV.get() === -1 ? Math.min(1, (1 - progress.get()) * 6) * (0.4 + progress.get() * 0.6) : 0 }));

  const current = pages?.[page];
  const mask = current ? Math.max(0, current.end - current.start) : 0;
  const peekP = peekPage !== null ? pages?.[peekPage] : undefined;
  const peekMask = peekP ? Math.max(0, peekP.end - peekP.start) : 0;

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
  const copies: React.ReactElement[] = [];
  for (let i = from; i < to; i++) {
    children.push(<Measured key={items[i].key} index={i} item={items[i]} renderItem={renderItem} onItemLayout={onItemLayout} onItemLines={onItemLines} />);
    if (animate)
      copies.push(
        <View key={items[i].key} collapsable={false}>
          {renderItem(items[i], i, noLines)}
        </View>
      );
  }

  const layer = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, paddingTop: topPad, paddingBottom: bottomPad, backgroundColor: bg };
  const shadow = (style: object) => (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, left: '100%', width: SHADOW }, style]}>
      <LinearGradient colors={['rgba(0,0,0,0.32)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0)']} locations={[0, 0.35, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
    </Animated.View>
  );
  const dim = (style: object) => <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, style]} />;

  const peekLayer = animate ? (
    <Animated.View key="peek" pointerEvents="none" style={[layer, { zIndex: peekAbove ? 2 : 0 }, peekStyle]}>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <ScrollView key={`${seg}`} ref={peekRef} scrollEnabled={false} showsVerticalScrollIndicator={false} style={{ opacity: peekP ? 1 : 0 }}>
          {copies}
          <View style={{ height: height + 2 }} />
        </ScrollView>
        {peekMask < height && <View style={{ position: 'absolute', left: 0, right: 0, top: peekP ? peekMask : 0, bottom: 0, backgroundColor: bg }} />}
      </View>
      {dim(peekDim)}
      {shadow(peekShadow)}
    </Animated.View>
  ) : null;

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ flex: 1, overflow: 'hidden', backgroundColor: bg }} onLayout={onFrame}>
        {peekLayer}
        <Animated.View style={[layer, { zIndex: 1 }, currentStyle]}>
          <View style={{ flex: 1, overflow: 'hidden' }} onLayout={onWindow}>
            <ScrollView key={`${seg}`} ref={scrollRef} scrollEnabled={false} showsVerticalScrollIndicator={false} style={{ opacity: pages ? 1 : 0 }}>
              {children}
              <View style={{ height: height + 2 }} />
            </ScrollView>
            {pages && mask < height && <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: mask, bottom: 0, backgroundColor: bg }} />}
          </View>
          {dim(currentDim)}
          {shadow(currentShadow)}
        </Animated.View>
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
