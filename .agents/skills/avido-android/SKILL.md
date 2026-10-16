---
name: avido-android
description: Verify Ávido Expo/React Native changes on a local Android emulator using Maestro MCP, repeatable flows and ADB. Use for native reader testing, not browser-only checks.
---

# Ávido Android verification

The native project is this repository (`/Users/alejandro/Projects/avido` on
Alejandro's Mac). Read `docs/android-testing.md` for commands, evidence and build
requirements. The production app ID is `com.alexfdez.avido`; local QA uses
`com.alexfdez.avido.local`. The project uses npm. Recheck `package.json` before
using versioned Expo documentation.

Prefer the official Maestro MCP and CLI over desktop control. ADB covers APK
installation, boot checks, logs and deep links. Maestro covers screen hierarchy,
screenshots, semantic interaction and repeatable native tests. Use local tools;
cloud accounts, cloud builds and cloud tests are unnecessary.

1. Inspect the working tree and project instructions. Identify acceptance
   conditions and whether JS reload or a native rebuild is needed. Apply the
   Impeccable skill to UI changes and the Hooked skill to habit-loop changes.
2. Check ADB devices and boot readiness. Reuse `Pixel_9_Android_16`; do not create
   another emulator or clear its data as routine troubleshooting. Select an
   explicit serial when more than one device is connected.
3. Discover Maestro tools and schemas. Call `list_devices`, then inspect the
   screen before interactions and after navigation. Read `cheat_sheet` before
   unfamiliar flow commands. Prefer existing `testID`s over coordinates. Inspect
   screenshots for visual quality; hierarchy assertions alone are insufficient.
4. Build/install the requested revision locally. Record commit, APK SHA-256,
   version, signer and device. An old release validates tooling, not new source.
   Compare installed and new APK signers before installation. Never uninstall an
   existing personal installation to resolve a signature mismatch silently.
   Use `AVIDO_LOCAL_QA=1` for a separate QA package if required.
5. Run `npm run lint`, `npx tsc --noEmit`, relevant focused tests and Android
   export/build. Run committed `.maestro/` flows against current source.
   These flows must preserve app data: do not add `clearState: true`. Record
   setup requirements and restore settings changed during exploratory testing.
6. Save reports, screenshots and scoped crash logs under `artifacts/android/`
   (Git-ignored). State passed conditions and limitations precisely. Never claim
   emulator verification against a source revision that was not installed.

Follow existing delivery instructions after checks. Inspect `docs/releasing.md`
before pushing: the existing push-to-main workflow builds/releases an APK.
Local test setup does not itself require publishing or invoking that workflow.

If desktop control is unavoidable, follow the inherited Quitapon convention:
create/reuse a Simple Tasks item naming the concrete blocked operation and assign
Responsable=Codex; perform and verify it, then mark it Terminada. Prefer the CLI
when the newly configured MCP has not loaded, rather than desktop automation.

Adapted from Alejandro's `quitapon-android` skill.

Sources: [Maestro MCP](https://docs.maestro.dev/get-started/maestro-mcp),
[ADB](https://developer.android.com/tools/adb),
[Expo CLI](https://docs.expo.dev/more/expo-cli/),
[Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).
