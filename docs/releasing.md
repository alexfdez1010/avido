# Releasing

`.github/workflows/release-apk.yml` runs on every push to `main` (and manually via *workflow_dispatch*):

1. Installs dependencies and runs `expo prebuild` for Android.
2. Builds the release APK with Gradle.
3. Saves an optional workflow artifact and publishes a GitHub Release tagged
   `v1.0.<run_number>` with the APK attached. Artifact upload failures (including
   exhausted Actions storage) do not block the release attachment.

Each release attaches `avido.apk` for an easy, stable download URL and
`avido-<version>.apk` for a filename that identifies the version. Both files contain
the same APK. The website and README link to
[`releases/latest/download/avido.apk`](https://github.com/alexfdez1010/avido/releases/latest/download/avido.apk),
which follows the latest published release. Earlier releases need an `avido.apk`
asset added before that URL works for them.

The workflow runs TypeScript and lint checks before prebuild. Before publishing
source changes, also run the repository's regression tests locally:

```sh
npm ci
npm run lint
npm run typecheck
npm test
```

The APK workflow builds Android only. The repository does not currently publish
an iOS build, App Store release or Play Store listing. Browser previews are not a
replacement for native-reader verification; see [android-testing.md](android-testing.md).

## Versioning

`app.config.ts` reads `APP_VERSION` (version name) and `BUILD_NUMBER` (version code) from the environment. CI sets them to `1.0.<run_number>` and `<run_number>`; local builds default to `1.0.0` / `1`.

## Signing

The `plugins/with-release-signing.js` config plugin adds a release signing config that reads `AVIDO_KEYSTORE_PATH`, `AVIDO_KEYSTORE_PASSWORD`, `AVIDO_KEY_ALIAS` and `AVIDO_KEY_PASSWORD`. Without a signing-key path it falls back to the debug keystore. CI warns when the keystore secret is missing; a successful workflow alone does not establish a stable production signing identity.

To sign with your own key, add these repository secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Contents of the keystore encoded as a single-line Base64 string |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |

Changing the signing key later prevents in-place updates of already installed APKs.
Keep the same key for releases that should update one another and retain a secure
backup outside the repository. A CI-generated debug key can differ between runs,
so that fallback is unsuitable for a dependable public update path.

## Books and third-party assets

App source licensing does not grant rights to books users import or download.
Project Gutenberg titles are offered under its [terms and permissions](https://www.gutenberg.org/policy/permission.html); availability and copyright
status can vary by jurisdiction. Keep book fixtures synthetic or use material you
have permission to redistribute. Font packages and other dependencies retain
their own licenses.
