import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, ListTree, Type } from 'lucide-react-native';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ViewToken } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bar, Cta, Flame, Ring, Tap, Txt } from '@/components/kit';
import { BlockView, type BlockStyle, type OnLines } from '@/components/reader/block-view';
import { PagedView } from '@/components/reader/paged-view';
import { LiveToast } from '@/components/reader/live-toast';
import { PdfReader } from '@/components/reader/pdf-reader';
import { ReaderSettingsSheet } from '@/components/reader/settings-sheet';
import { TocSheet } from '@/components/reader/toc-sheet';
import { useReadingTracker } from '@/hooks/use-reading-tracker';
import { loadContent } from '@/lib/content';
import { dayKey, formatClock } from '@/lib/dates';
import type { Block, BookContent } from '@/lib/types';
import { CHARS_PER_PAGE } from '@/lib/types';
import { useGame } from '@/store/game';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { readingFonts } from '@/theme/fonts';
import { readerThemes, type ReaderTheme } from '@/theme/palette';
import { tx } from '@/i18n';

type Item = { key: string; chars: number; type: 'head' } | { key: string; chars: number; type: 'block'; block: Block; i: number } | { key: string; chars: number; type: 'foot' };

const WORDS_PER_MIN_CHARS = 1100;

function GoalChip({ theme }: { theme: ReaderTheme }) {
  const goal = useSettings((s) => s.dailyGoalMin);
  const sec = useGame((s) => s.days[dayKey()]?.sec ?? 0);
  const met = sec >= goal * 60;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ring size={26} stroke={3.5} value={sec / (goal * 60)} color={theme.accent} track={theme.line}>
        {met ? <Flame size={12} /> : null}
      </Ring>
      <Txt v="mono" color={theme.muted}>
        {Math.floor(sec / 60)}/{goal} min
      </Txt>
    </View>
  );
}

export default function ReaderScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useLibrary((s) => s.books[id]);
  const updateBook = useLibrary((s) => s.updateBook);
  const prefs = useSettings((s) => s.reader);
  const eink = useSettings((s) => s.eink);
  const theme = readerThemes[prefs.theme];
  const insets = useSafeAreaInsets();

  const [content, setContent] = useState<BookContent | null>(null);
  const [loadPct, setLoadPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [chapter, setChapter] = useState(book?.location?.chapter ?? 0);
  const [chrome, setChrome] = useState(false);
  const [sheet, setSheet] = useState<'none' | 'settings' | 'toc'>('none');
  const [pos, setPos] = useState(book?.progress ?? 0);
  const [pdfTotal, setPdfTotal] = useState(book?.pdfPages ?? 0);
  const listRef = useRef<FlashListRef<Item>>(null);
  const maxRef = useRef(book?.maxProgress ?? 0);
  const [initialBlock, setInitialBlock] = useState(book?.location?.block ?? 0);
  const [enterAtEnd, setEnterAtEnd] = useState(false);
  const paged = prefs.layout === 'paged';
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollY = useRef(0);
  const viewH = useRef(0);
  const viewW = useRef(0);
  const contentH = useRef(0);

  const tracker = useReadingTracker(id);
  const { poke, addPages } = tracker;

  useEffect(() => {
    if (!book) return;
    useGame.getState().setHold(true);
    useGame.getState().startSession(book.id, !book.firstOpenedAt);
    return () => {
      useGame.getState().setHold(false);
      useGame.getState().evaluate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!book || book.format === 'pdf') return;
    let alive = true;
    loadContent(book, (p) => alive && setLoadPct(p))
      .then((c) => {
        if (!alive) return;
        setContent(c);
        if (!book.totalChars || book.totalChars !== c.totalChars) updateBook(book.id, { totalChars: c.totalChars });
        setChapter((ch) => Math.min(ch, c.chapters.length - 1));
      })
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const offsets = useMemo(() => {
    if (!content) return [];
    const out: number[] = [];
    let acc = 0;
    for (const c of content.chapters) {
      out.push(acc);
      acc += c.chars;
    }
    return out;
  }, [content]);

  const items = useMemo<Item[]>(() => {
    const ch = content?.chapters[chapter];
    if (!ch) return [];
    return [{ key: 'head', chars: 0, type: 'head' }, ...ch.blocks.map((b, i) => ({ key: `b${i}`, chars: b.c, type: 'block' as const, block: b, i })), { key: 'foot', chars: 0, type: 'foot' }];
  }, [content, chapter]);

  const prefix = useMemo(() => {
    const ch = content?.chapters[chapter];
    if (!ch) return [];
    const out: number[] = [];
    let acc = 0;
    for (const b of ch.blocks) {
      out.push(acc);
      acc += b.c;
    }
    return out;
  }, [content, chapter]);

  const record = useCallback(
    (progress: number, location?: { chapter: number; block: number }, pdfPage?: number) => {
      setPos(progress);
      if (progress > maxRef.current) {
        const total = content?.totalChars ?? (pdfTotal ? pdfTotal * CHARS_PER_PAGE : 0);
        const pages = ((progress - maxRef.current) * total) / CHARS_PER_PAGE;
        if (pages < 60) addPages(pages);
        maxRef.current = progress;
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updateBook(id, { progress, maxProgress: maxRef.current, ...(location ? { location } : {}), ...(pdfPage ? { pdfPage } : {}) });
      }, 400);
    },
    [addPages, content, id, pdfTotal, updateBook]
  );

  const viewHandler = useRef<(info: { viewableItems: ViewToken<Item>[] }) => void>(() => {});
  const onViewable = useCallback((info: { viewableItems: ViewToken<Item>[] }) => viewHandler.current(info), []);
  const handleViewable = ({ viewableItems }: { viewableItems: ViewToken<Item>[] }) => {
    if (!content) return;
    poke();
    const blocks = viewableItems.filter((v) => v.item?.type === 'block') as ViewToken<Extract<Item, { type: 'block' }>>[];
    const sawFoot = viewableItems.some((v) => v.item?.type === 'foot');
    const ch = content.chapters[chapter];
    let charPos: number;
    let blockIdx = 0;
    if (sawFoot) {
      charPos = offsets[chapter] + ch.chars;
      blockIdx = Math.max(0, ch.blocks.length - 1);
    } else if (blocks.length) {
      blockIdx = blocks[0].item.i;
      const last = blocks[blocks.length - 1].item;
      charPos = offsets[chapter] + prefix[last.i] + last.block.c;
    } else return;
    record(Math.min(1, charPos / Math.max(1, content.totalChars)), { chapter, block: blockIdx });
  };
  useLayoutEffect(() => {
    viewHandler.current = handleViewable;
  });

  const goChapter = useCallback(
    (next: number, completeCurrent = false, atEnd = false) => {
      if (!content) return;
      const n = Math.max(0, Math.min(content.chapters.length - 1, next));
      if (completeCurrent) {
        const endProgress = (offsets[chapter] + content.chapters[chapter].chars) / content.totalChars;
        if (endProgress >= maxRef.current - 0.0005 && book?.location?.chapter !== n) useGame.getState().chapterDone();
        record(Math.min(1, endProgress), { chapter: n, block: 0 });
      } else {
        record(offsets[n] / content.totalChars, { chapter: n, block: 0 });
      }
      setInitialBlock(0);
      setEnterAtEnd(atEnd);
      scrollY.current = 0;
      setChapter(n);
      setSheet('none');
      requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: false }));
    },
    [book?.location?.chapter, chapter, content, offsets, record]
  );

  const finish = useCallback(() => {
    tracker.flush();
    useGame.getState().chapterDone();
    useGame.getState().finishBook(id);
    router.back();
  }, [id, tracker]);

  const toggle = useCallback(() => {
    poke();
    setChrome((c) => !c);
  }, [poke]);

  const turnPage = useCallback(
    (dir: 1 | -1) => {
      if (!content) return;
      poke();
      const max = Math.max(0, contentH.current - viewH.current);
      const y = scrollY.current;
      if (dir > 0 && y >= max - 2) {
        if (chapter < content.chapters.length - 1) goChapter(chapter + 1, true);
        return;
      }
      if (dir < 0 && y <= 2) {
        if (chapter > 0) goChapter(chapter - 1);
        return;
      }
      const step = viewH.current - insets.bottom - 48 - prefs.size * prefs.lineHeight;
      const next = Math.max(0, Math.min(max, y + dir * step));
      scrollY.current = next;
      listRef.current?.scrollToOffset({ offset: next, animated: false });
    },
    [chapter, content, goChapter, insets.bottom, poke, prefs.lineHeight, prefs.size]
  );

  const onPagedPage = useCallback(
    (first: number, last: number, atEnd: boolean) => {
      if (!content) return;
      const ch = content.chapters[chapter];
      const firstItem = items[first];
      const lastItem = items[last];
      const blockIdx = firstItem?.type === 'block' ? firstItem.i : firstItem?.type === 'foot' ? Math.max(0, ch.blocks.length - 1) : 0;
      let charPos: number;
      if (atEnd || lastItem?.type === 'foot') charPos = offsets[chapter] + ch.chars;
      else if (lastItem?.type === 'block') charPos = offsets[chapter] + prefix[lastItem.i] + lastItem.block.c;
      else charPos = offsets[chapter];
      record(Math.min(1, charPos / Math.max(1, content.totalChars)), { chapter, block: blockIdx });
    },
    [chapter, content, items, offsets, prefix, record]
  );

  const onPagedEdge = useCallback(
    (dir: 1 | -1) => {
      if (!content) return;
      if (dir > 0 && chapter < content.chapters.length - 1) goChapter(chapter + 1, true);
      else if (dir < 0 && chapter > 0) goChapter(chapter - 1, false, true);
    },
    [chapter, content, goChapter]
  );

  const onTap = useCallback(
    (x: number) => {
      if (!eink || chrome) return toggle();
      const w = viewW.current || 1;
      if (x < w * 0.3) turnPage(-1);
      else if (x > w * 0.7) turnPage(1);
      else toggle();
    },
    [chrome, eink, toggle, turnPage]
  );

  const tapHandler = useRef<(x: number) => void>(() => {});
  useLayoutEffect(() => {
    tapHandler.current = onTap;
  });
  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(260)
        .maxDistance(10)
        .runOnJS(true)
        // eslint-disable-next-line react-hooks/refs -- gesture callback, runs outside render
        .onEnd((e) => tapHandler.current(e.x)),
    []
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    viewH.current = e.nativeEvent.layout.height;
    viewW.current = e.nativeEvent.layout.width;
  }, []);

  const st: BlockStyle = useMemo(
    () => ({ font: readingFonts[prefs.font], size: prefs.size, lineHeight: prefs.lineHeight, margin: prefs.margin, justify: prefs.justify, theme }),
    [prefs, theme]
  );

  if (!book) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Txt v="title" color={theme.text}>
          {tx('Libro no encontrado', 'Book not found')}
        </Txt>
        <View style={{ marginTop: 20 }}>
          <Cta label={tx('Volver', 'Back')} onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const ch = content?.chapters[chapter];
  const isLast = content ? chapter >= content.chapters.length - 1 : false;
  const chapterLeftChars = ch ? Math.max(0, offsets[chapter] + ch.chars - pos * (content?.totalChars ?? 0)) : 0;
  const minsLeft = Math.max(1, Math.round(chapterLeftChars / WORDS_PER_MIN_CHARS));

  const renderItem = ({ item }: { item: Item }, onLines?: OnLines) => {
    if (item.type === 'head')
      return (
        <View style={{ paddingHorizontal: prefs.margin, paddingTop: paged ? 12 : insets.top + 64, paddingBottom: 18 }}>
          <Txt v="eyebrow" color={theme.accent}>
            {tx('Capítulo', 'Chapter')} {chapter + 1} {tx('de', 'of')} {content?.chapters.length}
          </Txt>
          {ch && !/^h[12]$/.test(ch.blocks[0]?.k ?? '') && (
            <Txt style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: prefs.size * 1.4, lineHeight: prefs.size * 1.7, color: theme.text, marginTop: 10 }}>{ch.title}</Txt>
          )}
        </View>
      );
    if (item.type === 'block') return <BlockView block={item.block} st={st} first={item.i === 0} onLines={onLines} />;
    return (
      <View style={{ paddingHorizontal: prefs.margin, paddingTop: 40, paddingBottom: paged ? 24 : insets.bottom + 120 }}>
        <View style={{ paddingTop: 28, alignItems: 'center' }}>
          {isLast ? (
            <>
              <Txt style={{ fontFamily: 'Fraunces_900Black_Italic', fontSize: 44, color: theme.accent }}>{tx('Fin', 'The end')}</Txt>
              <View style={{ height: 20 }} />
              <Cta label={book.finishedAt ? tx('Volver a la biblioteca', 'Back to library') : tx('Terminar libro  ·  +XP', 'Finish book  ·  +XP')} onPress={book.finishedAt ? () => router.back() : finish} />
            </>
          ) : (
            <>
              <Txt v="eyebrow" color={theme.muted}>
                {tx('Capítulo completado', 'Chapter complete')} · +15 XP
              </Txt>
              <Txt style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: theme.text, marginTop: 10, marginBottom: 22, textAlign: 'center' }} numberOfLines={2}>
                {content?.chapters[chapter + 1]?.title}
              </Txt>
              <Cta label={tx('Siguiente capítulo', 'Next chapter')} onPress={() => goChapter(chapter + 1, true)} />
            </>
          )}
        </View>
      </View>
    );
  };

  const isPdf = book.format === 'pdf';
  const loading = !isPdf && !content && !error;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={theme.statusBar} hidden={!chrome} animated />
      {error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Txt v="title" color={theme.text} center>
            {tx('No se pudo abrir el libro', 'Couldn\'t open the book')}
          </Txt>
          <Txt v="body" color={theme.muted} center style={{ marginTop: 10 }}>
            {error}
          </Txt>
          <View style={{ marginTop: 22 }}>
            <Cta label={tx('Volver', 'Back')} onPress={() => router.back()} />
          </View>
        </View>
      ) : loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <ActivityIndicator color={theme.accent} />
          <Txt v="mono" color={theme.muted}>
            {tx('Preparando páginas', 'Preparing pages')}{loadPct ? ` · ${Math.round(loadPct * 100)}%` : '…'}
          </Txt>
        </View>
      ) : isPdf ? (
        <PdfReader
          book={book}
          theme={theme}
          onTap={toggle}
          onError={setError}
          onLoad={(n) => {
            setPdfTotal(n);
            if (book.pdfPages !== n) updateBook(id, { pdfPages: n, totalChars: n * CHARS_PER_PAGE });
          }}
          onPage={(page, n) => {
            poke();
            record(n <= 1 ? 1 : (page - 1) / (n - 1), undefined, page);
          }}
        />
      ) : paged ? (
        <PagedView
          key={`${chapter}`}
          items={items}
          renderItem={(item, _i, onLines) => renderItem({ item }, onLines)}
          initialIndex={initialBlock > 0 ? initialBlock + 1 : 0}
          startAtEnd={enterAtEnd}
          bg={theme.bg}
          topPad={insets.top + 8}
          bottomPad={Math.max(insets.bottom, 8) + 34}
          chrome={chrome}
          layoutKey={`${prefs.font}-${prefs.size}-${prefs.lineHeight}-${prefs.margin}-${prefs.justify}`}
          onPage={onPagedPage}
          onEdge={onPagedEdge}
          onToggle={toggle}
          onTurn={poke}
        />
      ) : (
        <GestureDetector gesture={tap}>
          <View style={{ flex: 1 }} onLayout={onLayout}>
            <FlashList
              ref={listRef}
              key={`${chapter}`}
              data={items}
              renderItem={renderItem}
              keyExtractor={(it) => it.key}
              getItemType={(it) => (it.type === 'block' ? it.block.k : it.type)}
              initialScrollIndex={initialBlock > 0 ? initialBlock + 1 : undefined}
              onViewableItemsChanged={onViewable}
              viewabilityConfig={{ itemVisiblePercentThreshold: 60, minimumViewTime: 250 }}
              onScrollBeginDrag={poke}
              onScroll={onScroll}
              scrollEventThrottle={32}
              onContentSizeChange={(_, h) => {
                contentH.current = h;
              }}
              showsVerticalScrollIndicator={false}
              extraData={st}
            />
          </View>
        </GestureDetector>
      )}

      {!chrome && !error && !loading && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8), backgroundColor: theme.bg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: prefs.margin, paddingBottom: 6 }}>
            <Txt v="mono" color={theme.muted} style={{ fontSize: 10.5 }}>
              {isPdf ? `${book.pdfPage ?? 1} / ${pdfTotal || '–'}` : `${minsLeft} min`}
            </Txt>
            <Txt v="mono" color={theme.muted} style={{ fontSize: 10.5 }}>
              {Math.floor(pos * 100)}%
            </Txt>
          </View>
          <View style={{ height: 2, backgroundColor: theme.line }}>
            <View style={{ height: 2, width: `${pos * 100}%`, backgroundColor: theme.accent }} />
          </View>
        </View>
      )}

      {chrome && (
        <>
          <Animated.View
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(160)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 10, backgroundColor: theme.bg, }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Tap onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={22} color={theme.text} />
              </Tap>
              <View style={{ flex: 1 }}>
                <Txt v="label" color={theme.text} numberOfLines={1}>
                  {book.title}
                </Txt>
                <Txt v="caption" color={theme.muted} numberOfLines={1}>
                  {isPdf ? `${tx('Página', 'Page')} ${book.pdfPage ?? 1} ${tx('de', 'of')} ${pdfTotal || '–'}` : ch?.title}
                </Txt>
              </View>
              {!isPdf && (
                <Tap onPress={() => setSheet('toc')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <ListTree size={21} color={theme.text} />
                </Tap>
              )}
              {!isPdf && (
                <Tap onPress={() => setSheet('settings')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Type size={21} color={theme.text} />
                </Tap>
              )}
            </View>
          </Animated.View>
          <Animated.View
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(160)}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: Math.max(insets.bottom, 12) + 6, paddingTop: 16, paddingHorizontal: 22, backgroundColor: theme.bg, gap: 14 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt v="number" color={theme.text}>
                {Math.floor(pos * 100)}
                <Txt v="mono" color={theme.muted}>
                  %
                </Txt>
              </Txt>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt v="mono" color={theme.accent}>
                  {formatClock(tracker.sessionSec)}
                </Txt>
                {tracker.idle && (
                  <Txt v="caption" color={theme.muted}>
                    {tx('en pausa', 'paused')}
                  </Txt>
                )}
              </View>
            </View>
            <Bar value={pos} color={theme.accent} track={theme.line} height={4} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <GoalChip theme={theme} />
              {!isPdf && content && (
                <Txt v="mono" color={theme.muted}>
                  {tx('cap.', 'ch.')} {chapter + 1}/{content.chapters.length} · {minsLeft} min
                </Txt>
              )}
              {isPdf && !book.finishedAt && pdfTotal > 0 && (book.pdfPage ?? 1) >= pdfTotal && <Cta compact label={tx('Terminar', 'Finish')} onPress={finish} />}
            </View>
          </Animated.View>
        </>
      )}

      <LiveToast theme={theme} top={insets.top + (chrome ? 70 : 12)} />
      <ReaderSettingsSheet open={sheet === 'settings'} onClose={() => setSheet('none')} />
      {content && <TocSheet open={sheet === 'toc'} onClose={() => setSheet('none')} chapters={content.chapters} current={chapter} theme={theme} onPick={(i) => goChapter(i)} />}
    </View>
  );
}
