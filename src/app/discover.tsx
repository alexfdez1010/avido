import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AlertCircle, ArrowLeft, BookOpen, Download, Search, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cta, GUTTER, Tap, Txt } from '@/components/kit';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import { usePalette } from '@/hooks/use-palette';
import { catalogUrl, downloadFreeBook, fetchCatalog, fileNameFor, type FreeBook } from '@/lib/gutenberg';
import { pickFolder } from '@/lib/library';
import { useLibrary } from '@/store/library';
import { fonts } from '@/theme/fonts';
import { isEs, tx } from '@/i18n';

type Lang = 'es' | 'en' | '';
const LANGS: { id: Lang; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: '', label: tx('Todos', 'All') },
];

type Status = 'loading' | 'error' | string;

function Row({ book, status, done, onPress }: { book: FreeBook; status?: Status; done: boolean; onPress: () => void }) {
  const p = usePalette();
  const [coverFailed, setCoverFailed] = useState(false);
  const busy = status === 'loading';
  return (
    <Tap onPress={onPress} disabled={busy} scale={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.line }}>
      <View style={{ width: 52, height: 78, borderRadius: 5, overflow: 'hidden', backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center' }}>
        {!coverFailed ? (
          <Image source={book.cover} style={{ width: 52, height: 78 }} contentFit="cover" transition={p.ink ? 0 : 150} onError={() => setCoverFailed(true)} />
        ) : (
          <BookOpen size={18} color={p.faint} />
        )}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Txt v="label" numberOfLines={2} style={{ fontFamily: fonts.display, fontSize: 16, lineHeight: 20 }}>
          {book.title}
        </Txt>
        {!!book.author && (
          <Txt v="caption" tone="muted" numberOfLines={1}>
            {book.author}
          </Txt>
        )}
      </View>
      <View style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: done ? 0 : 1, borderColor: p.line, backgroundColor: done ? p.ember : 'transparent' }}>
        {busy ? (
          <ActivityIndicator size="small" color={p.ember} />
        ) : status === 'error' ? (
          <AlertCircle size={18} color={p.text} />
        ) : done ? (
          <BookOpen size={18} color={p.onEmber} />
        ) : (
          <Download size={18} color={p.soft} />
        )}
      </View>
    </Tap>
  );
}

export default function Discover() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const folderUri = useLibrary((s) => s.folderUri);
  const downloaded = useLibrary((s) => s.downloaded);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<Lang>(isEs ? 'es' : 'en');
  const [books, setBooks] = useState<FreeBook[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Record<number, Status>>({});
  const loadingMore = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 450);
    return () => clearTimeout(t);
  }, [q]);

  const firstPage = catalogUrl({ search: query, language: lang || undefined });
  const loading = loadedUrl !== firstPage;
  const current = useRef(firstPage);
  useEffect(() => {
    current.current = firstPage;
  }, [firstPage]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCatalog(firstPage, ctrl.signal)
      .then((page) => {
        setBooks(page.books);
        setNext(page.next);
        setFailed(false);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoadedUrl(firstPage);
      });
    return () => ctrl.abort();
  }, [firstPage, attempt]);

  const loadMore = async () => {
    if (!next || loading || loadingMore.current) return;
    loadingMore.current = true;
    const base = firstPage;
    try {
      const page = await fetchCatalog(next);
      if (current.current !== base) return;
      setBooks((prev) => {
        const seen = new Set(prev.map((b) => b.id));
        return [...prev, ...page.books.filter((b) => !seen.has(b.id))];
      });
      setNext(page.next);
    } catch {
      setNext(null);
    } finally {
      loadingMore.current = false;
    }
  };

  const onBook = async (book: FreeBook) => {
    const s = status[book.id];
    if (s === 'loading') return;
    if (s && s !== 'error') return router.push(`/reader/${s}`);
    const name = fileNameFor(book);
    const existing = Object.values(useLibrary.getState().books).find((b) => b.fileName === name && !b.missing);
    if (existing) return router.push(`/reader/${existing.id}`);
    if (!folderUri) return pickFolder();
    setStatus((m) => ({ ...m, [book.id]: 'loading' }));
    try {
      const id = await downloadFreeBook(book);
      setStatus((m) => ({ ...m, [book.id]: id ?? 'error' }));
    } catch (e) {
      console.warn('Book download failed', e);
      setStatus((m) => ({ ...m, [book.id]: 'error' }));
    }
  };

  const header = (
    <View style={{ paddingTop: insets.top + 6 }}>
      <View style={{ paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: p.ink ? p.text : p.line }}>
        <Tap onPress={() => router.back()} accessibilityLabel={tx('Volver', 'Back')} style={{ width: 48, height: 48, marginLeft: -12, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={p.text} />
        </Tap>
        <Txt v="eyebrow" tone="muted" style={{ marginTop: 4 }}>
          {tx('Clásicos libres · Project Gutenberg', 'Free classics · Project Gutenberg')}
        </Txt>
        <Txt v="display" style={{ marginTop: 6 }}>{tx('Descubrir', 'Discover')}</Txt>
      </View>
      {!folderUri && (
        <View style={{ marginTop: 18, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface, gap: 12 }}>
          <Txt v="label">{tx('Elige una carpeta para guardar los libros', 'Choose a folder to save books')}</Txt>
          <Cta compact label={tx('Elegir carpeta', 'Choose folder')} onPress={pickFolder} />
        </View>
      )}
      <Input style={{ marginTop: 18, backgroundColor: p.surface, borderWidth: 1, borderColor: p.ink ? p.text : p.line, height: 50, borderRadius: 14 }}>
        <InputSlot style={{ paddingLeft: 14 }}>
          <Search size={17} color={p.muted} />
        </InputSlot>
        <InputField value={q} onChangeText={setQ} placeholder={tx('Título o autor', 'Title or author')} placeholderTextColor={p.faint} returnKeyType="search" autoCorrect={false} onSubmitEditing={() => setQuery(q)} style={{ fontFamily: fonts.ui, color: p.text, fontSize: 15 }} />
        {!!q && (
          <InputSlot style={{ paddingRight: 14 }} onPress={() => setQ('')}>
            <X size={16} color={p.muted} />
          </InputSlot>
        )}
      </Input>
      <View style={{ flexDirection: 'row', gap: 22, marginTop: 10, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: p.line }}>
        {LANGS.map((l) => {
          const on = l.id === lang;
          return (
            <Tap key={l.id || 'all'} feedback="select" scale={0.98} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setLang(l.id)} style={{ height: 46, justifyContent: 'center' }}>
              <Txt v="label" style={{ fontSize: 14, fontFamily: on ? fonts.uiBold : fonts.uiMedium }} color={on ? p.text : p.muted}>
                {l.label}
              </Txt>
              {on && <View style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2.5, borderRadius: 2, backgroundColor: p.ember }} />}
            </Tap>
          );
        })}
      </View>
    </View>
  );

  const empty = loading ? (
    <ActivityIndicator color={p.ember} style={{ marginTop: 60 }} />
  ) : (
    <View style={{ alignItems: 'center', paddingVertical: 50, gap: 14 }}>
      <Txt v="title" center>
        {failed ? tx('Sin conexión', 'No connection') : tx('Nada por aquí', 'Nothing here')}
      </Txt>
      {failed && <Cta compact kind="quiet" label={tx('Reintentar', 'Retry')} onPress={() => {
            setLoadedUrl(null);
            setAttempt((n) => n + 1);
          }} />}
    </View>
  );

  const footer = loading || failed ? null : (
    <View style={{ paddingVertical: 24, alignItems: 'center', gap: 16 }}>
      {!!next && books.length > 0 && <ActivityIndicator color={p.ember} />}
      {books.length > 0 && (
        <Tap feedback={false} onPress={() => Linking.openURL('https://www.gutenberg.org')}>
          <Txt v="mono" tone="faint">
            Project Gutenberg
          </Txt>
        </Tap>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <FlashList
        data={loading || failed ? [] : books}
        keyExtractor={(b) => String(b.id)}
        extraData={{ status, downloaded, folderUri }}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const s = status[item.id];
          const done = (!!s && s !== 'loading' && s !== 'error') || (!!downloaded[item.id] && !s);
          return <Row book={item} status={s} done={done} onPress={() => onBook(item)} />;
        }}
      />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: p.bg, opacity: 0.94 }} />
    </View>
  );
}
