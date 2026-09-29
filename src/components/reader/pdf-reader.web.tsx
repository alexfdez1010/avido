import React from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/kit';
import { tx } from '@/i18n';

export function PdfReader(_props: Record<string, unknown>) {
  return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}><Txt center>{tx('Abre este PDF en la aplicación móvil de Ávido.', 'Open this PDF in the Ávido mobile app.')}</Txt></View>;
}
