import { ChevronLeft, Folder, HardDrive } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { AppState, ScrollView, View } from 'react-native';

import { Cta, Sheet, Tap, Txt } from '@/components/kit';
import { usePalette } from '@/hooks/use-palette';
import { tx } from '@/i18n';
import { folderNameOf, setBooksFolder } from '@/lib/library';
import { STORAGE_ROOT, hasStorageAccess, listSubfolders, parentOf, requestStorageAccess } from '@/lib/storage-access';
import { useFolderBrowser } from '@/store/folder-browser';

const trim = (uri: string) => uri.replace(/\/$/, '');

export function FolderBrowserHost() {
  const p = usePalette();
  const open = useFolderBrowser((s) => s.open);
  const setOpen = useFolderBrowser((s) => s.set);
  const [, setTick] = useState(0);
  const [path, setPath] = useState(STORAGE_ROOT);
  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!open) return;
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') setTick((t) => t + 1);
    });
    return () => sub.remove();
  }, [open]);

  const access = open && hasStorageAccess();

  const up = parentOf(path);
  const folders = open && access ? listSubfolders(path) : [];
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onClose={close} maxHeight="80%">
      {!access ? (
        <View style={{ width: '100%', paddingTop: 8, gap: 16 }}>
          <HardDrive size={28} color={p.ember} />
          <Txt v="headline">{tx('Acceso al almacenamiento', 'Storage access')}</Txt>
          <Txt v="body" tone="soft">
            {tx(
              'El selector del sistema no ha devuelto la carpeta. Permite el acceso a archivos para elegirla desde aquí.',
              "The system picker didn't return the folder. Allow file access to choose it here instead."
            )}
          </Txt>
          <Cta label={tx('Permitir acceso', 'Allow access')} onPress={async () => {
              await requestStorageAccess();
              refresh();
            }} />
        </View>
      ) : (
        <View style={{ width: '100%', paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            {up && (
              <Tap onPress={() => setPath(up)} style={{ padding: 6, marginLeft: -6 }}>
                <ChevronLeft size={22} color={p.text} />
              </Tap>
            )}
            <Txt v="headline" numberOfLines={1} style={{ flex: 1 }}>
              {up ? folderNameOf(path) : tx('Almacenamiento', 'Storage')}
            </Txt>
          </View>
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {folders.length === 0 && (
              <Txt v="body" tone="muted" style={{ paddingVertical: 14 }}>
                {tx('Sin subcarpetas', 'No subfolders')}
              </Txt>
            )}
            {folders.map((d) => (
              <Tap key={d.uri} onPress={() => setPath(trim(d.uri))} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 }}>
                <Folder size={19} color={p.soft} />
                <Txt v="body" numberOfLines={1} style={{ flex: 1 }}>
                  {d.name}
                </Txt>
              </Tap>
            ))}
          </ScrollView>
          <View style={{ marginTop: 16 }}>
            <Cta
              label={up ? tx(`Usar «${folderNameOf(path)}»`, `Use "${folderNameOf(path)}"`) : tx('Usar todo el almacenamiento', 'Use all storage')}
              onPress={() => {
                setBooksFolder(path, up ? folderNameOf(path) : tx('Almacenamiento', 'Storage'));
                close();
              }}
            />
          </View>
        </View>
      )}
    </Sheet>
  );
}
