import { router } from 'expo-router';
import { FolderOpen, Play, Snowflake } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Bar, Card, Cover, Cta, Flame, Ring, Screen, SectionTitle, Tap, Txt } from '@/components/kit';
import { QuestsCard } from '@/components/home/quests-card';
import { WeekStrip } from '@/components/home/week-strip';
import { levelProgress, levelTitle, streakMultiplier } from '@/game/levels';
import { usePalette } from '@/hooks/use-palette';
import { dayKey, greeting } from '@/lib/dates';
import { pickFolder } from '@/lib/library';
import type { Book } from '@/lib/types';
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
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
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
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: todayMet ? p.emberSoft : p.surface, borderRadius: 999, paddingVertical: 6, paddingLeft: 8, paddingRight: 12 }}>
          <Flame size={20} dim={!todayMet && streak === 0} />
          <Txt v="number" style={{ fontSize: 18 }} tone={todayMet ? 'ember' : 'text'}>
            {streak}
          </Txt>
        </View>
        <Txt v="mono" tone="muted">
          {tx('Nv', 'Lv')} {level}
        </Txt>
      </View>
    </View>
  );
}

function GoalCard() {
  const p = usePalette();
  const goal = useSettings((s) => s.dailyGoalMin);
  const log = useGame((s) => s.days[dayKey()]);
  const freezes = useGame((s) => s.freezes);
  const streak = useStreak();
  const sec = log?.sec ?? 0;
  const met = !!log?.goalMet;
  const left = Math.max(0, Math.ceil(goal - sec / 60));
  const mult = streakMultiplier(streak);
  const hour = new Date().getHours();
  const danger = !met && streak > 0 && hour >= 18;
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
      <Ring size={112} stroke={11} value={sec / (goal * 60)} color={met ? p.mint : p.ember}>
        <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 34, lineHeight: 38, color: p.text }}>{Math.floor(sec / 60)}</Txt>
        <Txt v="mono" tone="muted" style={{ marginTop: -2 }}>
          {tx('de', 'of')} {goal} min
        </Txt>
      </Ring>
      <View style={{ flex: 1, gap: 6 }}>
        <Txt v="eyebrow" color={met ? p.mint : danger ? p.ember : p.muted}>
          {met ? tx('Meta cumplida', 'Goal reached') : danger ? tx('Racha en peligro', 'Streak at risk') : tx('Meta de hoy', "Today's goal")}
        </Txt>
        {!met && (
          <Txt v="headline" style={{ fontSize: 18, lineHeight: 23 }}>
            {tx(`Faltan ${left} min`, `${left} min left`)}
          </Txt>
        )}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {mult > 1 && (
            <View style={{ backgroundColor: p.goldSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
              <Txt v="mono" color={p.gold} style={{ fontSize: 11 }}>
                XP ×{mult.toFixed(2)}
              </Txt>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(143,211,255,0.12)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Snowflake size={11} color="#8FD3FF" />
            <Txt v="mono" color="#8FD3FF" style={{ fontSize: 11 }}>
              {freezes}
            </Txt>
          </View>
        </View>
      </View>
    </Card>
  );
}

function ContinueCard({ book }: { book: Book }) {
  const p = usePalette();
  const pages = book.totalChars ? Math.round((book.totalChars * (1 - book.progress)) / 1500) : book.pdfPages ? Math.round(book.pdfPages * (1 - book.progress)) : 0;
  return (
    <Tap onPress={() => router.push(`/reader/${book.id}`)} scale={0.98}>
      <View style={{ backgroundColor: p.surface, borderRadius: 26, padding: 18, flexDirection: 'row', gap: 18, overflow: 'hidden' }}>
        <Cover book={book} width={96} />
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View>
            <Txt v="title" numberOfLines={2}>
              {book.title}
            </Txt>
            {!!book.author && (
              <Txt v="caption" tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>
                {book.author}
              </Txt>
            )}
          </View>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt v="mono" tone="soft">
                {Math.floor(book.progress * 100)}%
              </Txt>
              {pages > 0 && (
                <Txt v="mono" tone="muted">
                  {tx(`quedan ${pages} pág`, `${pages} pp left`)}
                </Txt>
              )}
            </View>
            <Bar value={book.progress} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: p.ember, alignItems: 'center', justifyContent: 'center' }}>
                <Play size={15} color={p.onEmber} fill={p.onEmber} />
              </View>
              <Txt v="label">{book.progress > 0 ? tx('Seguir leyendo', 'Keep reading') : tx('Empezar a leer', 'Start reading')}</Txt>
            </View>
          </View>
        </View>
      </View>
    </Tap>
  );
}

function LevelStrip() {
  const p = usePalette();
  const xp = useGame((s) => s.xp);
  const lp = levelProgress(xp);
  return (
    <Tap onPress={() => router.push('/trophies')} scale={0.99}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: p.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 26, color: p.gold }}>{lp.level}</Txt>
          </View>
          <View style={{ flex: 1, gap: 7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt v="headline">{levelTitle(lp.level)}</Txt>
              <Txt v="mono" tone="muted">
                {Math.round(lp.toNext)} XP {tx('para Nv', 'to Lv')} {lp.level + 1}
              </Txt>
            </View>
            <Bar value={lp.ratio} color={p.gold} />
          </View>
        </View>
      </Card>
    </Tap>
  );
}

function EmptyLibrary() {
  const p = usePalette();
  return (
    <Tap onPress={pickFolder}>
      <View style={{ borderRadius: 26, padding: 24, gap: 10, backgroundColor: p.emberSoft }}>
        <FolderOpen size={28} color={p.ember} />
        <Txt v="title">{tx('Conecta tu carpeta de libros', 'Connect your books folder')}</Txt>
      </View>
    </Tap>
  );
}

export default function Today() {
  const p = usePalette();
  const booksMap = useLibrary((s) => s.books);
  const folder = useLibrary((s) => s.folderUri);
  const { current, shelf, suggestion } = useMemo(() => {
    const all = Object.values(booksMap).filter((b) => !b.missing);
    const reading = all.filter((b) => b.lastOpenedAt && !b.finishedAt).sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0));
    const fresh = all.filter((b) => !b.lastOpenedAt && !b.finishedAt).sort((a, b) => b.addedAt - a.addedAt || a.title.localeCompare(b.title));
    return { current: reading[0], shelf: reading.slice(1, 10), suggestion: fresh[0] };
  }, [booksMap]);

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(380)}>
        <Header />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(60).duration(380)} style={{ marginTop: 26 }}>
        {current ? <ContinueCard book={current} /> : suggestion ? <ContinueCard book={suggestion} /> : !folder ? <EmptyLibrary /> : (
          <Card>
            <Txt v="title">{tx('Tu carpeta está vacía', 'Your folder is empty')}</Txt>
            <View style={{ height: 16 }} />
            <Cta compact kind="quiet" label={tx('Cambiar carpeta', 'Change folder')} onPress={pickFolder} />
          </Card>
        )}
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).duration(380)} style={{ marginTop: 14 }}>
        <GoalCard />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(180).duration(380)}>
        <View style={{ marginTop: 26 }}>
          <WeekStrip />
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(240).duration(380)} style={{ marginTop: 26 }}>
        <QuestsCard />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(300).duration(380)} style={{ marginTop: 14 }}>
        <LevelStrip />
      </Animated.View>
      {shelf.length > 0 && (
        <>
          <SectionTitle
            right={
              <Tap onPress={() => router.push('/library')}>
                <Txt v="label" tone="ember">
                  {tx('Ver todo', 'See all')}
                </Txt>
              </Tap>
            }
          >
            <Txt v="eyebrow" tone="muted">
              {tx('También leyendo', 'Also reading')}
            </Txt>
          </SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -22 }} contentContainerStyle={{ paddingHorizontal: 22, gap: 14 }}>
            {shelf.map((b) => (
              <Tap key={b.id} onPress={() => router.push(`/reader/${b.id}`)} style={{ width: 100, gap: 8 }}>
                <Cover book={b} width={100} />
                <Bar value={b.progress} height={3} />
                <Txt v="caption" numberOfLines={2} tone="soft">
                  {b.title}
                </Txt>
              </Tap>
            ))}
          </ScrollView>
        </>
      )}
      <View style={{ height: 10, backgroundColor: p.bg }} />
    </Screen>
  );
}
