import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Cta, PageHeader, Screen, SectionTitle, StatRow, Tap, Txt } from '@/components/kit';
import { usePalette } from '@/hooks/use-palette';
import { formatDuration, monthShort, weekdayShort } from '@/lib/dates';
import { CHARS_PER_PAGE } from '@/lib/types';
import { CHARS_PER_WORD, peakHours, previousStats, rangeStats, relativeChange, type Bucket, type StatsRange } from '@/lib/stats';
import { useGame } from '@/store/game';
import { useLibrary } from '@/store/library';
import { fonts } from '@/theme/fonts';
import { fmtNum, tx } from '@/i18n';

const RANGES: { id: StatsRange; label: string; title: string }[] = [
  { id: 'week', label: tx('7 días', '7 days'), title: tx('Últimos 7 días', 'Last 7 days') },
  { id: 'month', label: tx('30 días', '30 days'), title: tx('Últimos 30 días', 'Last 30 days') },
  { id: 'year', label: tx('12 meses', '12 months'), title: tx('Últimos 12 meses', 'Last 12 months') },
  { id: 'all', label: tx('Todo', 'All'), title: tx('Desde el principio', 'All time') },
];

const num = (n: number, digits = 0) => n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
const pagesFmt = (n: number) => (n > 0 && n < 10 ? num(n, 1) : fmtNum(Math.round(n)));
const hoursFmt = (sec: number) => (sec >= 36000 ? `${Math.round(sec / 3600)} h` : formatDuration(sec));

function Delta({ value }: { value: number | null }) {
  const p = usePalette();
  if (value == null || !isFinite(value)) return null;
  const pct = Math.round(value * 100);
  if (pct === 0) return <Txt v="mono" tone="muted">{tx('igual que antes', 'same as before')}</Txt>;
  return (
    <Txt v="mono" color={p.ink ? p.text : pct > 0 ? p.ember : p.muted}>
      {pct > 0 ? '↑' : '↓'} {Math.abs(pct)}% {tx('vs. periodo anterior', 'vs. previous period')}
    </Txt>
  );
}

function RangePicker({ value, onChange }: { value: StatsRange; onChange: (r: StatsRange) => void }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 18 }}>
      {RANGES.map((r) => {
        const on = r.id === value;
        return (
          <Tap
            key={r.id}
            onPress={() => onChange(r.id)}
            feedback="select"
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={{ flex: 1, minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? p.text : p.surface }}
          >
            <Txt v="label" numberOfLines={1} color={on ? p.bg : p.muted} style={{ fontSize: 13.5, fontFamily: on ? fonts.uiBold : fonts.uiMedium }}>
              {r.label}
            </Txt>
          </Tap>
        );
      })}
    </View>
  );
}

function bucketLabel(b: Bucket, monthly: boolean, n: number, i: number): string | null {
  if (monthly) return n <= 12 || i % Math.ceil(n / 6) === 0 ? monthShort(b.start).slice(0, 3) : null;
  if (n <= 7) return weekdayShort(b.start).slice(0, 2);
  if (i === 0 || i === n - 1 || i === Math.floor(n / 2)) return `${b.start.getDate()}`;
  return null;
}

function PagesChart({ buckets, monthly }: { buckets: Bucket[]; monthly: boolean }) {
  const p = usePalette();
  const values = buckets.map((b) => (monthly ? b.pages / b.days : b.pages));
  const max = Math.max(1, ...values);
  const n = buckets.length;
  const H = 132;
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Txt v="eyebrow" tone="muted" style={{ fontSize: 9.5 }}>
          {monthly ? tx('Páginas al día · media mensual', 'Pages per day · monthly avg') : tx('Páginas por día', 'Pages per day')}
        </Txt>
        <Txt v="mono" tone="muted" style={{ fontSize: 10.5 }}>
          {tx('máx.', 'max')} {pagesFmt(max)}
        </Txt>
      </View>
      <View style={{ height: H, flexDirection: 'row', alignItems: 'flex-end', gap: n > 40 ? 1 : n > 14 ? 2 : 6, borderBottomWidth: 1, borderBottomColor: p.ink ? p.text : p.line }}>
        {buckets.map((b, i) => {
          const v = values[i];
          const h = v > 0 ? Math.max(3, (v / max) * (H - 4)) : 0;
          return (
            <View key={b.key} style={{ flex: 1, height: H, justifyContent: 'flex-end' }}>
              {h > 0 ? (
                <View style={{ height: h, borderTopLeftRadius: n > 40 ? 1 : 3, borderTopRightRadius: n > 40 ? 1 : 3, backgroundColor: b.current ? (p.ink ? p.text : p.ember) : p.ink ? p.muted : p.soft, opacity: b.current || p.ink ? 1 : 0.55 }} />
              ) : (
                <View style={{ height: 2, marginBottom: -1, backgroundColor: p.ink ? p.faint : p.raised }} />
              )}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: n > 40 ? 1 : n > 14 ? 2 : 6, marginTop: 6 }}>
        {buckets.map((b, i) => {
          const l = bucketLabel(b, monthly, n, i);
          return (
            <View key={b.key} style={{ flex: 1, alignItems: 'center', overflow: 'visible' }}>
              {l ? (
                <Txt v="mono" numberOfLines={1} tone={b.current ? 'text' : 'muted'} style={{ fontSize: 10, width: 36, textAlign: 'center' }}>
                  {l}
                </Txt>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MiniBars({ values, labels, highlight }: { values: number[]; labels: (string | null)[]; highlight?: (i: number) => boolean }) {
  const p = usePalette();
  const max = Math.max(1, ...values);
  const H = 56;
  return (
    <View>
      <View style={{ height: H, flexDirection: 'row', alignItems: 'flex-end', gap: values.length > 12 ? 2 : 8 }}>
        {values.map((v, i) => {
          const on = highlight?.(i) ?? false;
          return (
            <View key={i} style={{ flex: 1, height: v > 0 ? Math.max(3, (v / max) * H) : 2, borderRadius: 2, backgroundColor: v <= 0 ? (p.ink ? p.faint : p.raised) : on ? (p.ink ? p.text : p.ember) : p.ink ? p.muted : p.soft, opacity: v > 0 && !on && !p.ink ? 0.5 : 1 }} />
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: values.length > 12 ? 2 : 8, marginTop: 6 }}>
        {labels.map((l, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            {l ? (
              <Txt v="mono" tone="muted" numberOfLines={1} style={{ fontSize: 10, width: 28, textAlign: 'center' }}>
                {l}
              </Txt>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function Line({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.ink ? p.faint : p.line }}>
      <View style={{ flexShrink: 1 }}>
        <Txt v="label">{label}</Txt>
        {hint ? (
          <Txt v="caption" tone="muted" style={{ marginTop: 2 }}>
            {hint}
          </Txt>
        ) : null}
      </View>
      <Txt v="number" numberOfLines={1} style={{ fontSize: 17, lineHeight: 22 }}>
        {value}
      </Txt>
    </View>
  );
}

const pad2 = (h: number) => `${String(h).padStart(2, '0')}:00`;

export default function Stats() {
  const p = usePalette();
  const days = useGame((s) => s.days);
  const totalSec = useGame((s) => s.totalSec);
  const books = useLibrary((s) => s.books);
  const [range, setRange] = useState<StatsRange>('week');

  const st = useMemo(() => rangeStats(days, range), [days, range]);
  const prev = useMemo(() => previousStats(days, range), [days, range]);
  const peak = peakHours(st.hours);
  const weekdayMax = Math.max(...st.weekdays);

  const topBooks = useMemo(
    () =>
      Object.values(books)
        .filter((b) => b.readSeconds >= 60)
        .sort((a, b) => b.readSeconds - a.readSeconds)
        .slice(0, 5),
    [books]
  );

  const header = <PageHeader eyebrow={RANGES.find((r) => r.id === range)?.title} title={tx('Estadísticas', 'Stats')} />;

  if (totalSec < 60) {
    return (
      <Screen>
        <PageHeader eyebrow={tx('Todo se guarda en tu móvil', 'Everything stays on your phone')} title={tx('Estadísticas', 'Stats')} />
        <View style={{ marginTop: 48, gap: 12 }}>
          <Txt v="title" italic>
            {tx('Aún no hay lecturas que contar.', 'Nothing to count yet.')}
          </Txt>
          <Txt v="body" tone="muted">
            {tx('Lee unos minutos y aquí verás tus páginas por día, tu velocidad y a qué horas lees.', 'Read for a few minutes and your pages per day, speed and reading hours will show up here.')}
          </Txt>
          <View style={{ marginTop: 12, alignSelf: 'flex-start' }}>
            <Cta label={tx('Ir a la biblioteca', 'Open library')} onPress={() => router.navigate('/library')} />
          </View>
        </View>
      </Screen>
    );
  }

  const minPerPage = st.pagesPerHour ? 60 / st.pagesPerHour : null;
  const avgSession = st.sessions > 0 ? st.sec / st.sessions : 0;

  return (
    <Screen>
      {header}
      <RangePicker value={range} onChange={setRange} />

      <View style={{ marginTop: 28, flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
        <Txt style={{ fontFamily: fonts.displayBlackItalic, fontSize: 80, lineHeight: 84, letterSpacing: -2.5, color: p.ink ? p.text : p.ember }} numberOfLines={1} adjustsFontSizeToFit>
          {pagesFmt(st.pagesPerDay)}
        </Txt>
        <View style={{ flex: 1, paddingBottom: 14 }}>
          <Txt v="headline">{tx('páginas al día', 'pages a day')}</Txt>
          <Txt v="caption" tone="muted" style={{ marginTop: 2 }}>
            {num(st.minPerDay)} {tx('min de media', 'min on average')}
          </Txt>
        </View>
      </View>
      <View style={{ marginTop: 4, minHeight: 16 }}>
        <Delta value={relativeChange(st.pagesPerDay, prev?.pagesPerDay ?? null)} />
      </View>

      <View style={{ marginTop: 22 }}>
        <PagesChart buckets={st.buckets} monthly={st.monthly} />
      </View>

      <View style={{ marginTop: 26 }}>
        <StatRow
          items={[
            { value: fmtNum(Math.round(st.pages)), label: tx('páginas', 'pages') },
            { value: hoursFmt(st.sec), label: tx('leyendo', 'reading') },
            { value: `${st.activeDays}/${st.days}`, label: tx('días activos', 'active days') },
          ]}
        />
      </View>

      <SectionTitle>{tx('Velocidad', 'Speed')}</SectionTitle>
      {st.pagesPerHour ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Txt v="numeral" style={{ fontSize: 44, lineHeight: 48 }}>
              {fmtNum(Math.round(st.pagesPerHour))}
            </Txt>
            <Txt v="label" tone="muted">
              {tx('páginas por hora', 'pages per hour')}
            </Txt>
          </View>
          <View style={{ marginTop: 4, minHeight: 16 }}>
            <Delta value={relativeChange(st.pagesPerHour, prev?.pagesPerHour ?? null)} />
          </View>
          <View style={{ marginTop: 8 }}>
            <Line label={tx('Palabras por minuto', 'Words per minute')} value={fmtNum(Math.round(st.wordsPerMin ?? 0))} hint={tx(`Estimado: ${fmtNum(CHARS_PER_PAGE)} caracteres por página`, `Estimate: ${fmtNum(CHARS_PER_PAGE)} characters per page`)} />
            <Line label={tx('Minutos por página', 'Minutes per page')} value={minPerPage ? num(minPerPage, 1) : '–'} />
            <Line label={tx('Un libro de 300 páginas', 'A 300-page book')} value={formatDuration((300 / st.pagesPerHour) * 3600)} />
          </View>
        </>
      ) : (
        <Txt v="body" tone="muted">
          {tx('Necesitamos al menos 10 minutos de lectura en este periodo para calcularla.', 'We need at least 10 minutes of reading in this period to work it out.')}
        </Txt>
      )}

      <SectionTitle>{tx('Sesiones', 'Sessions')}</SectionTitle>
      <StatRow
        items={[
          { value: fmtNum(st.sessions), label: tx('sesiones', 'sessions') },
          { value: avgSession ? formatDuration(avgSession) : '–', label: tx('media', 'average') },
          { value: st.longest ? formatDuration(st.longest) : '–', label: tx('la más larga', 'longest') },
        ]}
      />

      <SectionTitle>{tx('Cuándo lees', 'When you read')}</SectionTitle>
      {peak ? (
        <>
          <Txt v="title" italic>
            {pad2(peak.from)} – {pad2(peak.to)}
          </Txt>
          <Txt v="caption" tone="muted" style={{ marginTop: 2, marginBottom: 14 }}>
            {tx(`Tu franja favorita · ${Math.round(peak.share * 100)}% del tiempo`, `Your favourite window · ${Math.round(peak.share * 100)}% of your time`)}
          </Txt>
          <MiniBars values={st.hours} labels={st.hours.map((_, h) => (h % 6 === 0 ? `${h}h` : null))} highlight={(h) => [0, 1, 2].some((k) => (peak.from + k) % 24 === h)} />
        </>
      ) : (
        <Txt v="body" tone="muted">
          {tx('Las horas de lectura se registran desde esta versión.', 'Reading hours are recorded from this version on.')}
        </Txt>
      )}
      {weekdayMax > 0 && (
        <View style={{ marginTop: 24 }}>
          <MiniBars
            values={st.weekdays}
            labels={[0, 1, 2, 3, 4, 5, 6].map((i) => weekdayShort(new Date(2024, 0, 1 + i)).slice(0, 2))}
            highlight={(i) => st.weekdays[i] === weekdayMax}
          />
        </View>
      )}

      {topBooks.length > 0 && (
        <>
          <SectionTitle>{tx('Por libro', 'By book')}</SectionTitle>
          {topBooks.map((b) => {
            const pages = b.readPages ?? 0;
            const pph = b.readSeconds >= 600 && pages > 0 ? pages / (b.readSeconds / 3600) : null;
            return (
              <Tap key={b.id} onPress={() => router.push(`/reader/${b.id}`)} style={{ minHeight: 56, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderBottomColor: p.ink ? p.faint : p.line }}>
                <View style={{ flex: 1 }}>
                  <Txt v="label" numberOfLines={1}>
                    {b.title}
                  </Txt>
                  <Txt v="caption" tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>
                    {formatDuration(b.readSeconds)} · {Math.floor(b.progress * 100)}%
                  </Txt>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt v="mono" style={{ fontSize: 13 }}>
                    {pph ? fmtNum(Math.round(pph)) : '–'}
                  </Txt>
                  <Txt v="eyebrow" tone="muted" style={{ fontSize: 9 }}>
                    {tx('pág/h', 'pg/h')}
                  </Txt>
                </View>
              </Tap>
            );
          })}
        </>
      )}

      <Txt v="caption" tone="muted" style={{ marginTop: 32 }}>
        {tx(`Una página equivale a ${fmtNum(CHARS_PER_PAGE)} caracteres (~${Math.round(CHARS_PER_PAGE / CHARS_PER_WORD)} palabras). Estos datos no salen de tu móvil.`, `A page is ${fmtNum(CHARS_PER_PAGE)} characters (~${Math.round(CHARS_PER_PAGE / CHARS_PER_WORD)} words). This data never leaves your phone.`)}
      </Txt>
    </Screen>
  );
}
