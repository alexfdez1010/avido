import React from 'react';
import { View } from 'react-native';
import Pdf from 'react-native-pdf';

import type { Book } from '@/lib/types';
import type { ReaderTheme } from '@/theme/palette';

export function PdfReader({
  book,
  theme,
  onPage,
  onLoad,
  onTap,
  onError,
}: {
  book: Book;
  theme: ReaderTheme;
  onPage: (page: number, total: number) => void;
  onLoad: (total: number) => void;
  onTap: () => void;
  onError: (e: string) => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Pdf
        source={{ uri: book.uri }}
        page={book.pdfPage ?? 1}
        style={{ flex: 1, backgroundColor: theme.bg }}
        spacing={8}
        fitPolicy={0}
        enableAntialiasing
        onLoadComplete={(n) => onLoad(n)}
        onPageChanged={(page, n) => onPage(page, n)}
        onPageSingleTap={() => onTap()}
        onError={(e) => onError(String(e))}
      />
    </View>
  );
}
