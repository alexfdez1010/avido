import { Image } from 'expo-image';
import React, { memo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { hashString, seededRandom } from '@/lib/hash';
import type { Book } from '@/lib/types';
import { fonts } from '@/theme/fonts';

import { Txt } from './txt';

function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)}, ${s}%, ${l}%)`;
}

function Pattern({ seed, w, h, hue }: { seed: string; w: number; h: number; hue: number }) {
  const rand = seededRandom(parseInt(hashString(seed), 36));
  const kind = Math.floor(rand() * 3);
  const ink = hsl(hue, 60, 72);
  if (kind === 0) {
    const r = w * (0.22 + rand() * 0.18);
    return (
      <Svg width={w} height={h} style={{ position: 'absolute' }}>
        <Circle cx={w * (0.3 + rand() * 0.5)} cy={h * (0.62 + rand() * 0.14)} r={r} fill={ink} opacity={0.9} />
      </Svg>
    );
  }
  if (kind === 1) {
    const n = 5 + Math.floor(rand() * 5);
    return (
      <Svg width={w} height={h} style={{ position: 'absolute' }}>
        {Array.from({ length: n }).map((_, i) => (
          <Line key={i} x1={0} x2={w} y1={h * 0.55 + i * ((h * 0.4) / n)} y2={h * 0.55 + i * ((h * 0.4) / n)} stroke={ink} strokeWidth={1.4} opacity={0.35 + (i / n) * 0.6} />
        ))}
      </Svg>
    );
  }
  const s = w * (0.3 + rand() * 0.2);
  return (
    <Svg width={w} height={h} style={{ position: 'absolute' }}>
      <Rect x={w - s - w * 0.1} y={h * 0.58} width={s} height={s} fill="none" stroke={ink} strokeWidth={1.6} transform={`rotate(${Math.round(rand() * 30 - 15)} ${w - s / 2} ${h * 0.58 + s / 2})`} />
      <Circle cx={w * 0.22} cy={h * 0.82} r={w * 0.05} fill={ink} />
    </Svg>
  );
}

export const Cover = memo(function Cover({ book, width, radius = 6 }: { book: Pick<Book, 'id' | 'title' | 'author' | 'coverUri' | 'hue' | 'format'>; width: number; radius?: number }) {
  const height = Math.round(width * 1.5);
  const small = width < 90;
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: hsl(book.hue, 32, 20),
        shadowColor: '#000',
        shadowOpacity: 0.28,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      {book.coverUri ? (
        <Image source={{ uri: book.coverUri }} style={{ width, height }} contentFit="cover" transition={180} />
      ) : (
        <>
          <Pattern seed={book.id} w={width} h={height} hue={book.hue} />
          <View style={{ padding: small ? 7 : 12, paddingTop: small ? 9 : 16, flex: 1 }}>
            <Txt
              numberOfLines={small ? 4 : 5}
              style={{ fontFamily: fonts.displayItalic, fontSize: small ? 11 : Math.max(13, width / 8), lineHeight: small ? 13 : Math.max(15, width / 6.6), color: hsl(book.hue, 30, 92) }}
            >
              {book.title}
            </Txt>
            {!!book.author && !small && (
              <Txt numberOfLines={1} v="eyebrow" style={{ marginTop: 6, color: hsl(book.hue, 25, 70), fontSize: 8.5, letterSpacing: 1.2 }}>
                {book.author}
              </Txt>
            )}
          </View>
        </>
      )}
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: 'rgba(0,0,0,0.22)' }} />
      {book.format !== 'epub' && (
        <View style={{ position: 'absolute', right: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
          <Txt v="eyebrow" style={{ color: '#fff', fontSize: 8, letterSpacing: 1 }}>
            {book.format}
          </Txt>
        </View>
      )}
    </View>
  );
});
