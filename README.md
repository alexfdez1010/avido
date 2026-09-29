# Ávido

Lector de libros para Android que convierte la lectura en un juego: XP, niveles, rachas, misiones diarias, logros y un reto anual para leer más libros.

- Elige una carpeta del dispositivo y Ávido detecta tus **EPUB, PDF, TXT y Markdown** (recursivo).
- Lector con temas Papel / Sepia / Ocaso / Noche / Tinta, tipografías Literata, Newsreader, Fraunces y Atkinson Hyperlegible, tamaño, interlineado, márgenes y justificación.
- Progreso guardado por libro, índice de capítulos y tiempo de lectura.
- Gamificación: meta diaria de minutos, racha con protectores, multiplicador de XP, tres misiones al día, 32 logros, heatmap de constancia y recordatorios.

Construido con Expo SDK 57, React Native, Expo Router y gluestack-ui.

## Instalar

Cada push a `main` genera un APK firmado en [Releases](../../releases). Descárgalo e instálalo en Android.

Para firmar con tu propia clave, añade estos secrets al repositorio (si no existen se usa la clave debug):

| Secret | Contenido |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | contraseña del keystore |
| `ANDROID_KEY_ALIAS` | alias de la clave |
| `ANDROID_KEY_PASSWORD` | contraseña de la clave |

## Desarrollo

```bash
npm ci
npx expo prebuild --platform android --clean
npx expo run:android          # build de desarrollo
npx tsc --noEmit && npx expo lint
```

APK release local:

```bash
npx expo prebuild --platform android --clean --no-install
cd android && ./gradlew assembleRelease
# android/app/build/outputs/apk/release/app-release.apk
```
