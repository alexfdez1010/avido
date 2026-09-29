# Releasing

`.github/workflows/release-apk.yml` runs on every push to `main` (and manually via *workflow_dispatch*):

1. Installs dependencies and runs `expo prebuild` for Android.
2. Builds the release APK with Gradle.
3. Uploads it as a workflow artifact and publishes a GitHub Release tagged `v1.0.<run_number>` with the APK attached.

## Versioning

`app.config.ts` reads `APP_VERSION` (version name) and `BUILD_NUMBER` (version code) from the environment. CI sets them to `1.0.<run_number>` and `<run_number>`; local builds default to `1.0.0` / `1`.

## Signing

The `plugins/with-release-signing.js` config plugin adds a release signing config that reads `AVIDO_KEYSTORE_PATH`, `AVIDO_KEYSTORE_PASSWORD`, `AVIDO_KEY_ALIAS` and `AVIDO_KEY_PASSWORD`. Without them it falls back to the debug keystore.

To sign with your own key, add these repository secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |

Changing the signing key later prevents in-place updates of already installed APKs.
