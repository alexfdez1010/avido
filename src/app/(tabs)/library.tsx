import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Check, FolderOpen, RefreshCw, RotateCcw, Search, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bar, Cover, Cta, Sheet, TAB_BAR_SPACE, Tap, Txt } from '@/components/kit';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import { usePalette } from '@/hooks/use-palette';
import { formatDuration } from '@/lib/dates';
import { pickFolder, scanLibrary } from '@/lib/library';
import { clearBookCache } from '@/lib/paths';
import type { Book } from '@/lib/types';
import { useGame } from '@/store/game';
import { useLibrary, useScan } from '@/store/library';
import { fonts } from '@/theme/fonts';
import { tx } from '@/i18n';

type Filter = 'all' | 'reading' | 'new' | 'done';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: tx('Todos', 'All') },
  { id: 'reading', label: tx('Leyendo', 'Reading') },
  { id: 'new', label: tx('Por empezar', 'Not started') },
  { id: 'done', label: tx('Terminados', 'Finished') },
];

function BookSheet({ book, onClose }: { book: Book | null; onClose: () => void }) {
  const p = usePalette();
  const updateBook = useLibrary((s) => s.updateBook);
  if (!book) return <Sheet open={false} onClose={onClose}><View /></Sheet>;
  const pages = book.totalChars ? Math.round(book.totalChars / 1500) : book.pdfPages;
  return (
    <Sheet open={!!book} onClose={onClose}>
      <View style={{ width: '100%', paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', gap: 18 }}>
          <Cover book={book} width={92} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="title" numberOfLines={3}>
              {book.title}
            </Txt>
            {!!book.author && (
              <Txt v="body" tone="muted">
                {book.author}
              </Txt>
            )}
            <Txt v="mono" tone="faint" style={{ marginTop: 6 }} numberOfLines={1}>
              {book.format.toUpperCase()} · {(book.size / 1024 / 1024).toFixed(1)} MB{pages ? ` · ~${pages} ${tx('pág', 'pp')}` : ''}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
          {[
            { k: tx('Progreso', 'Progress'), v: `${Math.floor(book.progress * 100)}%` },
            { k: tx('Tiempo', 'Time'), v: book.readSeconds ? formatDuration(book.readSeconds) : '—' },
            { k: tx('Estado', 'Status'), v: book.finishedAt ? tx('Leído', 'Read') : book.lastOpenedAt ? tx('Leyendo', 'Reading') : tx('Nuevo', 'New') },
          ].map((s) => (
            <View key={s.k} style={{ flex: 1, backgroundColor: p.raised, borderRadius: 16, padding: 12 }}>
              <Txt v="eyebrow" tone="muted" style={{ fontSize: 9 }}>
                {s.k}
              </Txt>
              <Txt v="headline" style={{ marginTop: 4 }}>
                {s.v}
              </Txt>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 20, gap: 10 }}>
          <Cta
            label={book.finishedAt ? tx('Releer', 'Read again') : book.progress > 0 ? tx('Seguir leyendo', 'Keep reading') : tx('Empezar a leer', 'Start reading')}
            onPress={() => {
              onClose();
              router.push(`/reader/${book.id}`);
            }}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {!book.finishedAt && book.progress > 0.5 && (
              <View style={{ flex: 1 }}>
                <Cta
                  kind="quiet"
                  compact
                  label={tx('Ya lo terminé', 'I finished it')}
                  icon={<Check size={16} color={p.text} />}
                  onPress={() => {
                    useGame.getState().finishBook(book.id);
                    onClose();
                  }}
                />
              </View>
            )}
            {book.progress > 0 && !book.finishedAt && (
              <View style={{ flex: 1 }}>
                <Cta
                  kind="ghost"
                  compact
                  label={tx('Reiniciar', 'Restart')}
                  icon={<RotateCcw size={15} color={p.text} />}
                  onPress={() => {
                    updateBook(book.id, { progress: 0, location: { chapter: 0, block: 0 }, pdfPage: 1 });
                    onClose();
                  }}
                />
              </View>
            )}
          </View>
          {book.format === 'epub' && (
            <Tap
              onPress={() => {
                clearBookCache(book.id);
                updateBook(book.id, { metaLoaded: false });
                scanLibrary();
                onClose();
              }}
              style={{ alignSelf: 'center', padding: 8 }}
            >
              <Txt v="caption" tone="muted">
                {tx('Volver a procesar el archivo', 'Reprocess file')}
              </Txt>
            </Tap>
          )}
        </View>
      </View>
    </Sheet>
  );
}

export default function Library() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const books = useLibrary((s) => s.books);
  const folderName = useLibrary((s) => s.folderName);
  const folderUri = useLibrary((s) => s.folderUri);
  const scan = useScan();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Book | null>(null);

  const cols = 3;
  const gap = 16;
  const cw = Math.floor((width - 44 - gap * (cols - 1)) / cols);

  const all = useMemo(() => Object.values(books).filter((b) => !b.missing), [books]);
  const counts = useMemo(
    () => ({ all: all.length, reading: all.filter((b) => b.lastOpenedAt && !b.finishedAt).length, new: all.filter((b) => !b.lastOpenedAt && !b.finishedAt).length, done: all.filter((b) => b.finishedAt).length }),
    [all]
  );
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all
      .filter((b) => (filter === 'reading' ? b.lastOpenedAt && !b.finishedAt : filter === 'new' ? !b.lastOpenedAt && !b.finishedAt : filter === 'done' ? b.finishedAt : true))
      .filter((b) => !needle || b.title.toLowerCase().includes(needle) || b.author?.toLowerCase().includes(needle))
      .sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0) || a.title.localeCompare(b.title));
  }, [all, filter, q]);

  const header = (
    <View style={{ paddingTop: insets.top + 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Txt v="display">
            {tx('Biblioteca', 'Library')}
          </Txt>
        </View>
        <Tap onPress={() => scanLibrary()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={18} color={p.soft} />
        </Tap>
      </View>
      <Tap onPress={pickFolder} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <FolderOpen size={15} color={p.ember} />
        <Txt v="label" tone="ember" numberOfLines={1}>
          {folderName ?? tx('Elegir carpeta', 'Choose folder')}
        </Txt>
        {scan.scanning && (
          <Txt v="mono" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
            · {scan.message}
          </Txt>
        )}
      </Tap>
      {scan.scanning && scan.progress > 0 && scan.progress < 1 && (
        <View style={{ marginTop: 10 }}>
          <Bar value={scan.progress} height={3} />
        </View>
      )}
      <Input style={{ marginTop: 18, backgroundColor: p.surface, borderWidth: 0, height: 48, borderRadius: 16 }}>
        <InputSlot style={{ paddingLeft: 14 }}>
          <Search size={17} color={p.muted} />
        </InputSlot>
        <InputField value={q} onChangeText={setQ} placeholder={tx('Buscar título o autor', 'Search title or author')} placeholderTextColor={p.faint} style={{ fontFamily: fonts.ui, color: p.text, fontSize: 15 }} />
        {!!q && (
          <InputSlot style={{ paddingRight: 14 }} onPress={() => setQ('')}>
            <X size={16} color={p.muted} />
          </InputSlot>
        )}
      </Input>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, marginBottom: 20, marginHorizontal: -22 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 22 }}>
        {FILTERS.map((f) => {
          const on = f.id === filter;
          return (
            <Tap key={f.id} feedback="select" onPress={() => setFilter(f.id)} style={{ paddingHorizontal: 14, height: 34, borderRadius: 999, backgroundColor: on ? p.text : p.surface, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Txt v="label" style={{ fontSize: 13 }} color={on ? p.bg : p.soft}>
                {f.label}
              </Txt>
              <Txt v="mono" style={{ fontSize: 10.5 }} color={on ? p.bg : p.faint}>
                {counts[f.id]}
              </Txt>
            </Tap>
          );
        })}
      </ScrollView>
    </View>
  );

  const empty = (
    <View style={{ alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20, gap: 10 }}>
      <Txt style={{ fontFamily: fonts.displayBlackItalic, fontSize: 64, color: p.faint }}>∅</Txt>
      <Txt v="title" center>
        {!folderUri ? tx('Sin carpeta', 'No folder') : q ? tx('Nada por aquí', 'Nothing here') : tx('Aún no hay libros', 'No books yet')}
      </Txt>
      <Txt v="body" tone="muted" center>
        {!folderUri || q ? '' : 'EPUB · PDF · TXT · MD'}
      </Txt>
      {!folderUri && (
        <View style={{ marginTop: 10 }}>
          <Cta label={tx('Elegir carpeta', 'Choose folder')} onPress={pickFolder} />
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <FlashList
        data={list}
        numColumns={cols}
        keyExtractor={(b) => b.id}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + TAB_BAR_SPACE + 30 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => scanLibrary()} tintColor={p.ember} colors={[p.ember]} progressBackgroundColor={p.surface} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={{ flex: 1, alignItems: index % cols === 0 ? 'flex-start' : index % cols === cols - 1 ? 'flex-end' : 'center', marginBottom: 22 }}>
          <View style={{ width: cw }}>
            <Tap onPress={() => router.push(`/reader/${item.id}`)} onLongPress={() => setSelected(item)} delayLongPress={280}>
              <Cover book={item} width={cw} />
              {item.finishedAt ? (
                <View style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: p.mint, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={13} color={p.bg} strokeWidth={3} />
                </View>
              ) : !item.lastOpenedAt ? (
                <View style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: 7, backgroundColor: p.ember, borderWidth: 3, borderColor: p.bg }} />
              ) : null}
            </Tap>
            {item.progress > 0 && !item.finishedAt && (
              <View style={{ marginTop: 8 }}>
                <Bar value={item.progress} height={3} />
              </View>
            )}
            <Tap onPress={() => setSelected(item)} feedback={false}>
              <Txt v="label" numberOfLines={2} style={{ marginTop: 8, fontSize: 13, lineHeight: 17 }}>
                {item.title}
              </Txt>
              {!!item.author && (
                <Txt v="caption" tone="muted" numberOfLines={1} style={{ fontSize: 11.5 }}>
                  {item.author}
                </Txt>
              )}
            </Tap>
          </View>
          </View>
        )}
      />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: p.bg, opacity: 0.94 }} />
      <BookSheet book={selected} onClose={() => setSelected(null)} />
    </View>
  );
}
