# Contributing to Ávido

Ávido is an Android reading app built around a simple idea: habit-forming design should help people read books they choose. Contributions should make reading more comfortable, returning easier and personal data easier to keep private.

## Before you start

- Open an issue before a large feature or architectural change so the scope can be discussed.
- Keep bug fixes and pull requests focused on one problem.
- Describe Android compatibility and accessibility implications when relevant.
- Discuss the product and privacy implications before adding accounts, remote tracking or new services.

## Local setup

Use Node.js 22 and npm. Install JDK 17 and the Android SDK for local native builds, then connect an Android device with debugging enabled or start an emulator.

```bash
git clone https://github.com/alexfdez1010/avido.git
cd avido
npm ci
npm run android
```

The app uses native modules, including its PDF reader and file access integrations, so Expo Go is not sufficient. After the initial development build is installed, start its server with:

```bash
npm start -- --dev-client
```

See [Android testing](docs/android-testing.md) for the repository's emulator validation workflow. Local QA builds can use the separate application ID described there to avoid replacing an installed release.

## Project conventions

- Routes live in `src/app/` and use Expo Router. Keep components, hooks and utilities outside that directory.
- Write code, identifiers, comments and documentation in English. User-facing text supports Spanish (Spain) and English through `tx` and `plural`; see [internationalization](docs/i18n.md).
- Keep gamification rules in `src/game/` and apply state changes through the existing stores. Persisted achievement IDs must remain stable.
- Prefer the current design system and existing platform integrations before adding dependencies.
- Configure native changes through `app.config.ts` and the plugins in `plugins/`. `android/` and `ios/` are generated; do not maintain manual edits there.
- Use `npx expo install <package>` for Expo-compatible dependency versions.
- Read the installed Expo major version in `package.json` and consult its [versioned documentation](https://docs.expo.dev/versions/v57.0.0/) before changing Expo or React Native integrations. Use the [Expo documentation index](https://docs.expo.dev/llms.txt) for other topics.

The [architecture guide](docs/architecture.md) explains the reader, library, stores and persistence. The [privacy guide](docs/privacy.md) describes the data boundaries contributors should preserve.

## Validate your change

Run these checks before opening a pull request:

```bash
npm run typecheck
npm run lint
npm test
```

For dependency or configuration changes, also run:

```bash
npx expo-doctor
```

Test behavior changes in a native Android development build. A successful web preview does not validate Android file permissions, PDF rendering, notifications or e-ink behavior. Describe the device or emulator and the flow you checked in your pull request. Add regression coverage where it demonstrates behavior that could otherwise break.

## Report a bug

Include:

- The app version, Android version and device model.
- Steps to reproduce, the expected result and what actually happened.
- The book format and whether the issue affects one book or several, for reader problems.
- Screenshots or logs when useful, with names, file paths and personal reading data removed.

Use a minimal public-domain or self-authored sample when a file is needed to reproduce a problem. Do not upload copyrighted books, credentials, signing keys or private reading history.

## Open a pull request

Explain the problem, the resulting behavior and how you validated it. Include before-and-after screenshots for visual changes, and update documentation when behavior or setup changes. Run the checks again after resolving conflicts.

Release signing belongs in repository secrets, not source files. See [releasing](docs/releasing.md) before changing the build or release workflow.

## License

Contributions to this repository are made under its [MIT license](LICENSE). Keep third-party licenses and attribution intact, and only contribute material you have the right to share.
