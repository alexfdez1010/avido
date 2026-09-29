import { Lock } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Bar, Card, Cover, Ring, Screen, SectionTitle, Sheet, Tap, Txt } from '@/components/kit';
import { Heatmap } from '@/components/trophies/heatmap';
import { ACHIEVEMENTS, type Achievement, type AchievementContext } from '@/game/achievements';
import { levelProgress, levelTitle, LEVEL_TITLES } from '@/game/levels';
import { usePalette } from '@/hooks/use-palette';
import { formatDuration } from '@/lib/dates';
import { computeStreak, useGame } from '@/store/game';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { fonts } from '@/theme/fonts';
import { isEs, LOCALE, tx } from '@/i18n';

function useContext(): AchievementContext {
  const g = useGame();
  const books = useLibrary((s) => s.books);
  return useMemo(() => {
    const list = Object.values(books);
    return {
      totalSec: g.totalSec,
      totalPages: g.totalPages,
      finished: g.finished.length,
      bestStreak: Math.max(g.bestStreak, computeStreak(g.days)),
      longestSession: g.longestSession,
      librarySize: list.filter((b) => !b.missing).length,
      goalsMet: g.goalsMet,
      questsDone: g.questsDone,
      level: levelProgress(g.xp).level,
      booksOpened: list.filter((b) => b.firstOpenedAt).length,
      nightOwl: !!g.flags.nightOwl,
      earlyBird: !!g.flags.earlyBird,
      weekend: !!g.flags.weekend,
      speedReader: !!g.flags.speedReader,
    };
  }, [g, books]);
}

function Badge({ a, unlocked, value, onPress }: { a: Achievement; unlocked: boolean; value: number; onPress: () => void }) {
  const p = usePalette();
  const ratio = Math.min(1, value / a.target);
  return (
    <Tap onPress={onPress} style={{ width: '31%', alignItems: 'center', marginBottom: 20 }}>
      <Ring size={84} stroke={4} value={unlocked ? 1 : ratio} color={unlocked ? p.gold : p.faint} track={p.raised}>
        <View
          style={{
            width: 66,
            height: 66,
            borderRadius: 33,
            backgroundColor: unlocked ? p.goldSoft : p.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {unlocked ? (
            <Txt
              style={{
                fontFamily: fonts.displayBlackItalic,
                fontSize: a.glyph.length > 3 ? 17 : a.glyph.length > 2 ? 20 : 26,
                color: p.gold,
              }}
            >
              {a.glyph}
            </Txt>
          ) : (
            <Lock size={18} color={p.faint} />
          )}
        </View>
      </Ring>
      <Txt v="label" center numberOfLines={2} tone={unlocked ? 'text' : 'muted'} style={{ marginTop: 8, fontSize: 12.5, lineHeight: 16, minHeight: 32 }}>
        {a.title}
      </Txt>
    </Tap>
  );
}

export default function Trophies() {
  const p = usePalette();
  const xp = useGame((s) => s.xp);
  const unlocked = useGame((s) => s.unlocked);
  const finished = useGame((s) => s.finished);
  const days = useGame((s) => s.days);
  const totalSec = useGame((s) => s.totalSec);
  const totalPages = useGame((s) => s.totalPages);
  const bestStreak = useGame((s) => s.bestStreak);
  const books = useLibrary((s) => s.books);
  const yearlyGoal = useSettings((s) => s.yearlyGoal);
  const ctx = useContext();
  const lp = levelProgress(xp);
  const streak = computeStreak(days);
  const [sel, setSel] = useState<Achievement | null>(null);

  const year = new Date().getFullYear();
  const thisYear = finished.filter((f) => new Date(f.at).getFullYear() === year);
  const dayOfYear = Math.floor((Date.now() - new Date(year, 0, 1).getTime()) / 86400000) + 1;
  const expected = (yearlyGoal * dayOfYear) / 365;
  const ahead = thisYear.length - expected;
  const pace = Math.max(1, Math.floor((365 - dayOfYear) / Math.max(1, yearlyGoal - thisYear.length)));
  const nUnlocked = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const ua = unlocked[a.id] ? 1 : 0;
    const ub = unlocked[b.id] ? 1 : 0;
    if (ua !== ub) return ub - ua;
    return b.metric(ctx) / b.target - a.metric(ctx) / a.target;
  });

  return (
    <Screen>
      <Txt v="eyebrow" tone="muted">
        {nUnlocked} {tx('de', 'of')} {ACHIEVEMENTS.length} {tx('logros', 'achievements')}
      </Txt>
      <Txt v="display" style={{ marginTop: 6 }}>
        {tx('Logros', 'Trophies')}
      </Txt>

      <Card style={{ marginTop: 22, padding: 22, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: -30, top: -40 }}>
          <Txt
            style={{
              fontFamily: fonts.displayBlackItalic,
              fontSize: 190,
              lineHeight: 200,
              color: p.goldSoft,
            }}
          >
            {lp.level}
          </Txt>
        </View>
        <Txt v="eyebrow" color={p.gold}>
          {tx('Nivel', 'Level')} {lp.level}
        </Txt>
        <Txt v="display" italic style={{ marginTop: 6 }}>
          {levelTitle(lp.level)}
        </Txt>
        <View style={{ marginTop: 18, gap: 8 }}>
          <Bar value={lp.ratio} color={p.gold} height={8} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt v="mono" tone="soft">
              {Math.floor(xp).toLocaleString(LOCALE)} XP
            </Txt>
            <Txt v="mono" tone="muted">
              {Math.round(lp.toNext)} {tx('para Nv', 'to Lv')} {lp.level + 1}
            </Txt>
          </View>
        </View>
        <Txt v="caption" tone="muted" style={{ marginTop: 12 }}>
          {tx('Próximo rango:', 'Next rank:')} {LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((lp.level - 1) / 3) + 1)]} · {tx('nivel', 'level')} {Math.floor((lp.level - 1) / 3) * 3 + 4}
        </Txt>
      </Card>

      <Card
        style={{
          marginTop: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <Ring size={96} stroke={9} value={thisYear.length / yearlyGoal}>
          <Txt
            style={{
              fontFamily: fonts.displayBlack,
              fontSize: 30,
              lineHeight: 34,
              color: p.text,
            }}
          >
            {thisYear.length}
          </Txt>
          <Txt v="mono" tone="muted">
            / {yearlyGoal}
          </Txt>
        </Ring>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="eyebrow" tone="muted">
            {tx('Reto', 'Challenge')} {year}
          </Txt>
          <Txt v="headline" style={{ fontSize: 18, lineHeight: 23 }}>
            {thisYear.length >= yearlyGoal
              ? tx('¡Reto superado! Sube la apuesta.', 'Challenge beaten! Raise the stakes.')
              : ahead >= 0
                ? isEs ? `Vas ${ahead >= 1 ? `${Math.floor(ahead)} por delante` : 'al día'}. Sigue así.` : `${ahead >= 1 ? `${Math.floor(ahead)} ahead of pace` : 'Right on pace'}. Keep going.`
                : tx(`Un libro cada ${pace} días y lo logras.`, `One book every ${pace} days and you'll make it.`)}
          </Txt>
          <Txt v="caption" tone="muted">
            {tx(`Faltan ${Math.max(0, yearlyGoal - thisYear.length)} libros`, `${Math.max(0, yearlyGoal - thisYear.length)} books to go`)} · {365 - dayOfYear} {tx('días', 'days')}
          </Txt>
        </View>
      </Card>

      <SectionTitle>
        <Txt v="eyebrow" tone="muted">
          {tx('Constancia', 'Consistency')}
        </Txt>
      </SectionTitle>
      <Card>
        <View style={{ flexDirection: 'row', marginBottom: 18 }}>
          {[
            { k: tx('Racha', 'Streak'), v: `${streak}`, u: tx('días', 'days') },
            { k: tx('Mejor', 'Best'), v: `${Math.max(bestStreak, streak)}`, u: tx('días', 'days') },
            {
              k: 'Total',
              v: formatDuration(totalSec).replace(' min', '′').replace(' h ', 'h '),
              u: tx('leído', 'read'),
            },
            { k: tx('Páginas', 'Pages'), v: `${Math.floor(totalPages)}`, u: tx('nuevas', 'new') },
          ].map((s) => (
            <View key={s.k} style={{ flex: 1 }}>
              <Txt v="eyebrow" tone="muted" style={{ fontSize: 9 }}>
                {s.k}
              </Txt>
              <Txt v="number" style={{ marginTop: 4, fontSize: 19 }} numberOfLines={1} adjustsFontSizeToFit>
                {s.v}
              </Txt>
              <Txt v="caption" tone="faint">
                {s.u}
              </Txt>
            </View>
          ))}
        </View>
        <Heatmap />
      </Card>

      <SectionTitle>
        <Txt v="eyebrow" tone="muted">
          {tx('Vitrina', 'Showcase')}
        </Txt>
      </SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: '3.5%' }}>
        {sorted.map((a) => (
          <Badge key={a.id} a={a} unlocked={!!unlocked[a.id]} value={a.metric(ctx)} onPress={() => setSel(a)} />
        ))}
      </View>

      {finished.length > 0 && (
        <>
          <SectionTitle>
            <Txt v="eyebrow" tone="muted">
              {tx('Terminados', 'Finished')} · {finished.length}
            </Txt>
          </SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[...finished].reverse().map((f) => {
              const b = books[f.id];
              return b ? (
                <View key={f.id} style={{ width: 72 }}>
                  <Cover book={b} width={72} radius={7} />
                  <Txt v="mono" tone="faint" style={{ fontSize: 9.5, marginTop: 4 }}>
                    {new Date(f.at).toLocaleDateString(LOCALE, {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Txt>
                </View>
              ) : null;
            })}
          </View>
        </>
      )}

      <Sheet open={!!sel} onClose={() => setSel(null)}>
        {sel ? (
          <View
            style={{
              width: '100%',
              alignItems: 'center',
              paddingVertical: 14,
              gap: 8,
            }}
          >
            <Txt
              style={{
                fontFamily: fonts.displayBlackItalic,
                fontSize: 56,
                lineHeight: 66,
                color: unlocked[sel.id] ? p.gold : p.faint,
              }}
            >
              {sel.glyph}
            </Txt>
            <Txt v="title" center>
              {sel.title}
            </Txt>
            <Txt v="body" tone="soft" center>
              {sel.desc}
            </Txt>
            <View style={{ alignSelf: 'stretch', marginTop: 14, gap: 8 }}>
              <Bar value={unlocked[sel.id] ? 1 : sel.metric(ctx) / sel.target} color={p.gold} height={6} />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Txt v="mono" tone="muted">
                  {unlocked[sel.id]
                    ? `${tx('Desbloqueado el', 'Unlocked on')} ${new Date(unlocked[sel.id]).toLocaleDateString(LOCALE)}`
                    : `${Math.floor((Math.min(sel.metric(ctx), sel.target) * 100) / sel.target)}% ${tx('completado', 'complete')}`}
                </Txt>
                <Txt v="mono" color={p.gold}>
                  +{sel.xp} XP
                </Txt>
              </View>
            </View>
          </View>
        ) : (
          <View />
        )}
      </Sheet>
    </Screen>
  );
}
