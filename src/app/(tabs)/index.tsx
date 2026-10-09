import { router, useFocusEffect } from 'expo-router';
import { Check, ChevronRight, Compass, FolderOpen, Play, Snowflake } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Bar, Card, Cover, Cta, Divider, Flame, GUTTER, PageHeader, Ring, Screen, SectionTitle, Tap, Txt } from '@/components/kit';
import { Miga } from '@/components/mascot/miga';
import { QuestsCard, useQuestSummary } from '@/components/home/quests-card';
import { WeekStrip } from '@/components/home/week-strip';
import { levelProgress, levelTitle, streakMultiplier } from '@/game/levels';
import { usePalette } from '@/hooks/use-palette';
import { dayKey, formatLongDate, greeting } from '@/lib/dates';
import { pickFolder } from '@/lib/library';
import { FINISH_THRESHOLD, type Book } from '@/lib/types';
import { useGame, useStreak } from '@/store/game';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { fonts } from '@/theme/fonts';
import { tx } from '@/i18n';

function Header() {
  const p = usePalette();
  const name = useSettings((s) => s.name);
  const streak = useStreak();
  const xp = useGame((s) => s.xp);
  const { level } = levelProgress(xp);
  const todayMet = useGame((s) => !!s.days[dayKey()]?.goalMet);
  return (
    <PageHeader
      eyebrow={formatLongDate()}
      right={
        <Tap onPress={() => router.push('/trophies')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Flame size={18} dim={!todayMet && streak === 0} />
            <Txt v="number" style={{ fontSize: 16, lineHeight: 20 }} tone={todayMet ? 'gold' : 'text'}>
              {streak}
            </Txt>
          </View>
          <View style={{ width: 1, height: 16, backgroundColor: p.line }} />
          <Txt v="mono" tone="soft">
            {tx('Nv', 'Lv')} {level}
          </Txt>
        </Tap>
      }
      title={
        <Txt v="display">
          {greeting()}
          {name ? ',' : '.'}
          {name ? (
            <Txt v="display" italic tone="ember">
              {'\n'}
              {name}.
            </Txt>
          ) : null}
        </Txt>
      }
    />
  );
}

function DayCard() {
  const p = usePalette();
  const goal = useSettings((s) => s.dailyGoalMin);
  const log = useGame((s) => s.days[dayKey()]);
  const freezes = useGame((s) => s.freezes);
  const streak = useStreak();
  const sec = log?.sec ?? 0;
  const met = !!log?.goalMet;
  const [active, setActive] = useState(false);
  useFocusEffect(useCallback(() => { setActive(true); return () => setActive(false); }, []));
  const mult = streakMultiplier(streak);
  const hour = new Date().getHours();
  const danger = !met && streak > 0 && hour >= 18;
  const left = Math.max(0, goal - Math.floor(sec / 60));
  return (
    <Card style={{ padding: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, padding: 18 }}>
        <Ring size={104} stroke={9} value={sec / (goal * 60)} color={met ? p.mint : p.ember}>
          <Miga size={86} mood={met ? 'happy' : 'reading'} active={active} interactive />
        </Ring>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="eyebrow" color={met ? p.mint : danger ? p.ember : p.muted}>
            {met ? tx('Meta cumplida', 'Goal reached') : danger ? tx('Racha en peligro', 'Streak at risk') : tx('Meta de hoy', "Today's goal")}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Txt v="numeral" style={{ fontSize: 40, lineHeight: 44 }}>
              {Math.floor(sec / 60)}
            </Txt>
            <Txt v="label" tone="muted">
              / {goal} min
            </Txt>
          </View>
          <Txt v="caption" tone="soft">
            {met ? tx('Hoy ya cuenta para la racha', 'Today counts for your streak') : tx(`Te faltan ${left} min`, `${left} min to go`)}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {mult > 1 && (
              <View style={{ backgroundColor: p.goldSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Txt v="mono" color={p.gold} style={{ fontSize: 11 }}>
                  XP ×{mult.toFixed(2)}
                </Txt>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: p.frostSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Snowflake size={11} color={p.frost} />
              <Txt v="mono" color={p.frost} style={{ fontSize: 11 }}>
                {freezes}
              </Txt>
            </View>
          </View>
        </View>
      </View>
      <Divider />
      <View style={{ paddingHorizontal: 10, paddingTop: 14, paddingBottom: 12 }}>
        <WeekStrip />
      </View>
    </Card>
  );
}

function NowReading({ book }: { book: Book }) {
  const p = usePalette();
  const pages = book.totalChars ? Math.round((book.totalChars * (1 - book.progress)) / 1500) : book.pdfPages ? Math.round(book.pdfPages * (1 - book.progress)) : 0;
  const open = () => router.push(`/reader/${book.id}`);
  return (
    <View>
      <Tap onPress={open} scale={0.99} style={{ flexDirection: 'row', gap: 18 }}>
        <Cover book={book} width={116} />
        <View style={{ flex: 1, paddingTop: 2 }}>
          <Txt v="title" numberOfLines={3} style={{ fontSize: 25, lineHeight: 29 }}>
            {book.title}
          </Txt>
          {!!book.author && (
            <Txt v="body" tone="muted" numberOfLines={2} style={{ marginTop: 4, fontFamily: fonts.displayRegularItalic }}>
              {book.author}
            </Txt>
          )}
          <View style={{ flex: 1 }} />
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Txt v="numeral" style={{ fontSize: 24, lineHeight: 28 }} tone="ember">
                {Math.floor(book.progress * 100)}%
              </Txt>
              {pages > 0 && (
                <Txt v="mono" tone="muted">
                  {tx(`quedan ${pages} pág`, `${pages} pp left`)}
                </Txt>
              )}
            </View>
            <Bar value={book.progress} height={5} />
          </View>
        </View>
      </Tap>
      <View style={{ marginTop: 18, flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Cta
            label={book.progress > 0 ? tx('Seguir leyendo', 'Keep reading') : tx('Empezar a leer', 'Start reading')}
            icon={<Play size={16} color={p.onEmber} fill={p.onEmber} />}
            onPress={open}
          />
        </View>
        {book.progress >= FINISH_THRESHOLD && (
          <Cta kind="quiet" label={tx('Terminar', 'Finish')} icon={<Check size={16} color={p.text} />} onPress={() => useGame.getState().finishBook(book.id)} />
        )}
      </View>
    </View>
  );
}

function LevelStrip() {
  const p = usePalette();
  const xp = useGame((s) => s.xp);
  const lp = levelProgress(xp);
  return (
    <Tap onPress={() => router.push('/trophies')} scale={0.99}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Txt style={{ fontFamily: fonts.displayBlackItalic, fontSize: 40, lineHeight: 44, color: p.gold, minWidth: 48 }}>{lp.level}</Txt>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <Txt v="headline" numberOfLines={1} style={{ flex: 1 }}>
              {levelTitle(lp.level)}
            </Txt>
            <Txt v="mono" tone="muted">
              {Math.round(lp.toNext)} XP
            </Txt>
          </View>
          <Bar value={lp.ratio} color={p.gold} height={4} />
          <Txt v="caption" tone="muted">
            {tx('para el nivel', 'to level')} {lp.level + 1}
          </Txt>
        </View>
        <ChevronRight size={18} color={p.faint} />
      </Card>
    </Tap>
  );
}

function EmptyLibrary() {
  const p = usePalette();
  return (
    <Card style={{ padding: 22, gap: 12 }}>
      <FolderOpen size={26} color={p.ember} />
      <Txt v="title">{tx('Conecta tu carpeta de libros', 'Connect your books folder')}</Txt>
      <Txt v="body" tone="muted">
        EPUB · PDF · TXT · MD
      </Txt>
      <View style={{ marginTop: 6, gap: 10 }}>
        <Cta label={tx('Elegir carpeta', 'Choose folder')} onPress={pickFolder} />
        <Cta kind="ghost" compact icon={<Compass size={16} color={p.text} />} label={tx('Descubrir clásicos', 'Discover classics')} onPress={() => router.push('/discover')} />
      </View>
    </Card>
  );
}

export default function Today() {
  const p = usePalette();
  const booksMap = useLibrary((s) => s.books);
  const folder = useLibrary((s) => s.folderUri);
  const { done, quests } = useQuestSummary();
  const { current, shelf, suggestion } = useMemo(() => {
    const all = Object.values(booksMap).filter((b) => !b.missing);
    const reading = all.filter((b) => b.lastOpenedAt && !b.finishedAt).sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0));
    const fresh = all.filter((b) => !b.lastOpenedAt && !b.finishedAt).sort((a, b) => b.addedAt - a.addedAt || a.title.localeCompare(b.title));
    return { current: reading[0], shelf: reading.slice(1, 10), suggestion: fresh[0] };
  }, [booksMap]);
  const hero = current ?? suggestion;

  return (
    <Screen>
      <Animated.View entering={FadeIn.duration(180)}>
        <Header />
      </Animated.View>
      <Animated.View entering={FadeIn.duration(180)}>
        <SectionTitle first>{hero ? (current ? tx('Ahora leyendo', 'Now reading') : tx('Para empezar', 'Up next')) : tx('Tu biblioteca', 'Your library')}</SectionTitle>
        {hero ? <NowReading book={hero} /> : !folder ? <EmptyLibrary /> : (
          <Card>
            <Txt v="title">{tx('Tu carpeta está vacía', 'Your folder is empty')}</Txt>
            <View style={{ height: 16 }} />
            <Cta compact kind="quiet" label={tx('Cambiar carpeta', 'Change folder')} onPress={pickFolder} />
          </Card>
        )}
      </Animated.View>
      <Animated.View entering={FadeIn.duration(180)}>
        <SectionTitle>{tx('Tu día', 'Your day')}</SectionTitle>
        <DayCard />
      </Animated.View>
      <Animated.View entering={FadeIn.duration(180)}>
        <SectionTitle
          right={
            <Txt v="mono" color={p.gold} style={{ fontSize: 11 }}>
              {done}/{quests.length} · {tx('pleno', 'all')} +100
            </Txt>
          }
        >
          {tx('Misiones', 'Quests')}
        </SectionTitle>
        <QuestsCard />
        <View style={{ height: 12 }} />
        <LevelStrip />
      </Animated.View>
      {shelf.length > 0 && (
        <>
          <SectionTitle
            right={
              <Tap onPress={() => router.push('/library')} style={{ minHeight: 40, justifyContent: 'center', paddingLeft: 8 }}>
                <Txt v="label" tone="ember">
                  {tx('Ver todo', 'See all')}
                </Txt>
              </Tap>
            }
          >
            {tx('También leyendo', 'Also reading')}
          </SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 16 }}>
            {shelf.map((b) => (
              <Tap key={b.id} onPress={() => router.push(`/reader/${b.id}`)} style={{ width: 104, gap: 8 }}>
                <Cover book={b} width={104} />
                <Bar value={b.progress} height={3} />
                <Txt v="label" numberOfLines={2} style={{ fontSize: 13, lineHeight: 17 }}>
                  {b.title}
                </Txt>
              </Tap>
            ))}
          </ScrollView>
        </>
      )}
    </Screen>
  );
}
