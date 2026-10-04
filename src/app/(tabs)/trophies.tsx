import { Lock } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Bar, Card, Cover, PageHeader, Ring, Screen, SectionTitle, Sheet, StatRow, Tap, Txt } from '@/components/kit';
import { Heatmap } from '@/components/trophies/heatmap';
import { ACHIEVEMENTS, type Achievement, type AchievementContext } from '@/game/achievements';
import { levelProgress, levelTitle } from '@/game/levels';
import { usePalette } from '@/hooks/use-palette';
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
      <PageHeader eyebrow={`${nUnlocked} ${tx('de', 'of')} ${ACHIEVEMENTS.length} ${tx('logros', 'achievements')}`} title={tx('Logros', 'Trophies')} />

      <View style={{ marginTop: 24, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
          <Txt style={{ fontFamily: fonts.displayBlackItalic, fontSize: 96, lineHeight: 96, color: p.gold, letterSpacing: -3 }}>{lp.level}</Txt>
          <View style={{ flex: 1, paddingBottom: 12 }}>
            <Txt v="eyebrow" color={p.gold}>
              {tx('Nivel', 'Level')} {lp.level}
            </Txt>
            <Txt v="title" italic style={{ marginTop: 4 }} numberOfLines={2}>
              {levelTitle(lp.level)}
            </Txt>
          </View>
        </View>
        <View style={{ marginTop: 14, gap: 8 }}>
          <Bar value={lp.ratio} color={p.gold} height={6} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt v="mono" tone="soft">
              {Math.floor(xp).toLocaleString(LOCALE)} XP
            </Txt>
            <Txt v="mono" tone="muted">
              {Math.round(lp.toNext)} {tx('para Nv', 'to Lv')} {lp.level + 1}
            </Txt>
          </View>
        </View>
      </View>

      <SectionTitle>{`${tx('Reto', 'Challenge')} ${year}`}</SectionTitle>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <Ring size={92} stroke={8} value={thisYear.length / yearlyGoal}>
          <Txt v="numeral" style={{ fontSize: 30, lineHeight: 34 }}>
            {thisYear.length}
          </Txt>
          <Txt v="mono" tone="muted">
            / {yearlyGoal}
          </Txt>
        </Ring>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="headline" style={{ fontSize: 18, lineHeight: 23 }}>
            {thisYear.length >= yearlyGoal
              ? tx('Reto superado', 'Challenge beaten')
              : ahead >= 0
                ? isEs ? (ahead >= 1 ? `${Math.floor(ahead)} por delante` : 'Al día') : ahead >= 1 ? `${Math.floor(ahead)} ahead` : 'On pace'
                : tx(`1 libro cada ${pace} días`, `1 book every ${pace} days`)}
          </Txt>
          <Txt v="caption" tone="muted">
            {tx(`Faltan ${Math.max(0, yearlyGoal - thisYear.length)} libros`, `${Math.max(0, yearlyGoal - thisYear.length)} books to go`)} · {365 - dayOfYear} {tx('días', 'days')}
          </Txt>
        </View>
      </Card>

      <SectionTitle>{tx('Constancia', 'Consistency')}</SectionTitle>
      <Card>
        <View style={{ marginBottom: 20 }}>
          <StatRow
            items={[
              { label: tx('Racha', 'Streak'), value: `${streak}` },
              { label: tx('Mejor', 'Best'), value: `${Math.max(bestStreak, streak)}` },
              { label: tx('Horas', 'Hours'), value: `${Math.floor(totalSec / 3600)}` },
              { label: tx('Páginas', 'Pages'), value: totalPages >= 1000 ? `${(totalPages / 1000).toFixed(1).replace(/\.0$/, '')}k` : `${Math.floor(totalPages)}` },
            ]}
          />
        </View>
        <Heatmap />
      </Card>

      <SectionTitle right={<Txt v="mono" tone="muted">{nUnlocked}/{ACHIEVEMENTS.length}</Txt>}>{tx('Vitrina', 'Showcase')}</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: '3.5%' }}>
        {sorted.map((a) => (
          <Badge key={a.id} a={a} unlocked={!!unlocked[a.id]} value={a.metric(ctx)} onPress={() => setSel(a)} />
        ))}
      </View>

      {finished.length > 0 && (
        <>
          <SectionTitle right={<Txt v="mono" tone="muted">{finished.length}</Txt>}>{tx('Terminados', 'Finished')}</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[...finished].reverse().map((f) => {
              const b = books[f.id];
              return b ? (
                <View key={f.id} style={{ width: 76 }}>
                  <Cover book={b} width={76} radius={5} />
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
