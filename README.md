# Ávido

An Android book reader that turns reading into a game — XP, levels, streaks, daily quests, achievements and a yearly challenge — built to make you finish more books.

Pick a folder on your device and Ávido picks up every book inside it.

## Features

- **Folder library** — choose a folder through Android's Storage Access Framework; Ávido scans it recursively and keeps it in sync. If the system picker doesn't work on a device, an in-app storage browser (all-files access) is available as a fallback.
- **Formats** — EPUB, PDF, TXT and Markdown (`.md`). EPUB/TXT/Markdown are reflowed with your typography settings; PDF is rendered page by page.
- **Reader** — themes (Paper, Sepia, Dusk, Night, Ink (OLED), E-ink), custom typefaces (Literata, Newsreader, Fraunces, Atkinson Hyperlegible), font size, line height, margins, justification, table of contents and per-book progress.
- **Gamification** — daily minute goal, streaks with freezes, streak XP multiplier, three daily quests, 32 achievements, yearly book challenge, activity heatmap and reminders. See [docs/gamification.md](docs/gamification.md).
- **E-ink mode** — pure black-and-white palette, no animations and tap-to-turn pages. Enabled automatically on known e-ink Android devices, or manually from Profile.
- **Languages** — Spanish (Spain) and English, selected from the device language (English fallback).

## Install

Every push to `main` builds a signed APK and publishes it on [Releases](../../releases). Download the latest `avido-<version>.apk` and install it on Android.

## Development

Requirements: Node 22, JDK 17 and the Android SDK.

```bash
npm ci
npx expo prebuild --platform android --clean
npx expo run:android            # development build on a device/emulator
```

Checks to run before pushing:

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

Local release APK:

```bash
npx expo prebuild --platform android --clean --no-install
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

`android/` is generated (Continuous Native Generation) — never edit it by hand; use `app.config.ts` and config plugins in `plugins/`.

## Documentation

- [Architecture](docs/architecture.md) — project layout, data flow and key modules.
- [Gamification](docs/gamification.md) — XP, levels, streaks, quests and achievements.
- [Internationalization](docs/i18n.md) — how UI strings are translated.
- [Releasing](docs/releasing.md) — CI workflow, versioning and signing.

## Tech stack

Expo SDK 57 · React Native · Expo Router · TypeScript · gluestack-ui v5 (UniWind / Tailwind CSS 4) · Zustand · Reanimated · FlashList · JSZip · react-native-pdf.
