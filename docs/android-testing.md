# Local Android verification

Use `.agents/skills/avido-android/SKILL.md`. All verification runs locally with
ADB, Maestro and the existing `Pixel_9_Android_16` AVD. The production app ID is
`com.alexfdez.avido`; `AVIDO_LOCAL_QA=1` selects `com.alexfdez.avido.local` for an
isolated QA installation. The project uses npm and Expo SDK 57.

## Tooling and emulator

On Alejandro's Mac:

```sh
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH="$HOME/.maestro/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$JAVA_HOME/bin:$PATH"
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
adb devices -l
```

Reuse a running emulator. Otherwise start the existing AVD without wiping data:

```sh
emulator -avd Pixel_9_Android_16 -no-audio -no-boot-anim
```

Keep it running. Check boot completion (`1`) and inspect the installed app before
installing another APK. Replace the serial if device discovery differs:

```sh
adb -s emulator-5554 shell getprop sys.boot_completed
adb -s emulator-5554 shell dumpsys package com.alexfdez.avido
adb -s emulator-5554 shell pm path com.alexfdez.avido
```

## Verify the requested source

```sh
npm ci
npm run lint
npx tsc --noEmit
npx expo export --platform android --output-dir dist/android
AVIDO_LOCAL_QA=1 npx expo prebuild --platform android --clean --no-install
AVIDO_LOCAL_QA=1 npx expo run:android --device emulator-5554
```

`expo export` checks Android JavaScript/assets, not native rendering. The local
`run:android` command generates the native project, builds and installs a debug
APK, and starts Metro. Keep Metro running for debug builds. Native
dependency/config changes require rebuilding; do not edit generated `android/`
files by hand. For a self-contained local release, add `--variant release` after
checking signing and version compatibility. Do not claim emulator coverage until
the requested source is actually installed.

Before an install, compare the installed APK's signer with the new APK using
`$ANDROID_HOME/build-tools/36.0.0/apksigner verify --print-certs <apk>`. Save the
installed APK with `adb pull` from the path returned by `pm path` when useful.
Never uninstall a personal app, clear its data, or replace a signing identity to
work around an install error. Use the local QA package when signers cannot match.
Record the actual app ID in test invocations. Use only synthetic books/data in QA.

## Maestro and evidence

With MCP, call `list_devices`, `inspect_screen`, then `run`; inspect again after
navigation. Read its `cheat_sheet` before unfamiliar commands. Maestro's local
viewer is [http://127.0.0.1:10000/](http://127.0.0.1:10000/). Use native semantic
selectors and existing test IDs, with screenshots for visual checks.

Committed `.maestro/` flows preserve app data (`clearState: false`). Read each
flow's setup comments, start from its required screen, and use a QA book rather
than changing personal reading progress. `reading-plan.yaml` verifies the untimed
default, selects 30 minutes and opens the book. `reading-timer.yaml` selects
5 minutes, waits for the actual reminder without gestures, verifies it disappears
without stopping the reader, and checks that returning home resets the selection
to untimed. `text-only-reader.yaml` clears the footer and verifies that reader
controls can still be recovered; it leaves QA reader settings in text-only mode.
Untimed reading is the default. Optional 5/15/30-minute reminders use foreground
reader time, including reading without touching the screen, and pause during
loading, settings or backgrounding. An explicitly chosen reminder appears once
even with all reader chrome hidden. Reading continues without a modal, writing
request or countdown stopping it. Reward toasts remain suppressed in text-only mode.
Restore settings changed by a manual check. Flows default to the QA app ID and
accept `APP_ID` to target another explicitly chosen installation:

```sh
maestro --device emulator-5554 test --test-output-dir artifacts/android/maestro .maestro/reading-plan.yaml
maestro --device emulator-5554 test --test-output-dir artifacts/android/maestro .maestro/text-only-reader.yaml
# Slow regression: allow five real minutes without interacting with the emulator.
maestro --device emulator-5554 test --test-output-dir artifacts/android/maestro .maestro/reading-timer.yaml
```

Save screenshots, reports, build logs, APK hashes and scoped crash logs under
`artifacts/android/` (Git-ignored). Record source commit/working tree, APK version
and SHA-256, signer, device and relevant tool versions. State unsupported or
unverified conditions explicitly; a previously installed release cannot prove
new changes. Do not use cloud Maestro runs or EAS for local verification.

Pushing `main` invokes the existing APK publication workflow described in
[releasing.md](releasing.md). Do not manually dispatch a remote build for local
testing.

References: [Expo CLI](https://docs.expo.dev/more/expo-cli/),
[SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[Maestro MCP](https://docs.maestro.dev/get-started/maestro-mcp),
[ADB](https://developer.android.com/tools/adb).
