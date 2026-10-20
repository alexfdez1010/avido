# Releasing

`.github/workflows/release-apk.yml` runs when a push to `main` changes the app,
its assets, local native modules, config plugins, dependencies, build/check
configuration, or the APK workflow itself. Website, README, documentation, video,
and standalone test changes do not rebuild or republish the APK. Keep the workflow's
`paths` list updated when introducing a new build input outside those locations.

To force a release without app changes, open **Actions → Build & release APK →
Run workflow**, select `main`, and run it manually. Automatic path filters do not
apply to this manual action.

1. Installs dependencies and runs `expo prebuild` for Android.
2. Builds the release APK with Gradle.
3. Saves one optional, versioned workflow artifact for three days and publishes a GitHub Release tagged
   `v1.0.<run_number>` with the APK attached. Artifact upload failures (including
   exhausted Actions storage) do not block the release attachment.

Each release attaches `avido.apk` for an easy, stable download URL and
`avido-<version>.apk` for a filename that identifies the version. Both files contain
the same APK. `SHA256SUMS.txt` lists the SHA-256 digest of both names. The website and README link to
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

## Build efficiency

The workflow preserves all three existing Android architectures (`arm64-v8a`,
`armeabi-v7a`, and `x86_64`) and generates a fresh native project on each build.
It uses npm's download cache, Gradle's dependency cache, Gradle task-output caching
(`--build-cache`), and a 1 GB `ccache` for the C++ compilation handled by React
Native's application CMake project. The compiler cache is restored for the same
dependency lockfile and validates compiler content; it does not store signing keys,
generated native projects, or completed APKs. Other native-library CMake projects
may compile independently of this cache.

The first build fills the task and compiler caches. Later builds can reuse unchanged
work, but changes to dependencies, compiler inputs, or cache eviction can still cause
a cold build. See the run's **Native compiler cache** summary for hits and misses,
and Gradle's final task summary for `from cache` counts. Compare these alongside
the **Build release APK** step duration before reporting a speedup.

Measured successful builds:

| Run | Build job duration | Build release APK step | Gradle task results |
| --- | --- | --- | --- |
| [16 October 2026 baseline](https://github.com/alexfdez1010/avido/actions/runs/38879901660) | 25m 53s | 22m 56s | 807 executed |
| [17 October 2026, first optimized run](https://github.com/alexfdez1010/avido/actions/runs/39015556307) | 17m 12s | 14m 41s | 711 executed, 96 from cache |

The first optimized run had no existing compiler cache: it recorded 303 cacheable
compilations, all misses, plus 15 uncacheable calls, and populated about 0.1 GB of
compiler outputs. Its shorter observed duration therefore does not establish a
warm compiler-cache speedup, nor can the whole difference be attributed to these
changes; runner performance and existing Gradle cache contents also vary. A later
run must demonstrate compiler-cache hits before claiming that benefit.

The workflow artifact stores only one copy without ZIP compression; both APK
filenames remain available on the permanent GitHub Release.

The APK workflow builds Android only. The repository does not currently publish
an iOS build or App Store release. The dedicated Google Play workflow is described below. Browser previews are not a
replacement for native-reader verification; see [android-testing.md](android-testing.md).

## Versioning

`app.config.ts` reads `APP_VERSION` (version name) and `BUILD_NUMBER` (version code) from the environment. CI sets them to `1.0.<run_number>` and `<run_number>`; local builds default to `1.0.0` / `1`.

## Signing

The `plugins/with-release-signing.js` config plugin adds a release signing config that reads `AVIDO_KEYSTORE_PATH`, `AVIDO_KEYSTORE_PASSWORD`, `AVIDO_KEY_ALIAS` and `AVIDO_KEY_PASSWORD`. Without a signing-key path it falls back to the debug keystore. CI verifies every APK against `.github/android-signer.sha256` before publication and stops on a mismatch. This pins the certificate used by the existing v1.0.25 release and prevents an accidental key change. The current certificate belongs to Expo’s shared template debug key, not a private production key. This preserves update compatibility but does not provide an exclusive publisher identity. Do not silently replace it: moving to a private production key needs an explicit migration plan, including progress export/import for installations that Android cannot update in place. The fallback key is deterministic in the current template; the fingerprint gate catches any future template change.

To sign with your own key, add these repository secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Contents of the keystore encoded as a single-line Base64 string |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |

Changing the signing key later prevents in-place updates of already installed APKs.
Keep the same key for releases that should update one another and retain a secure
backup outside the repository. Never regenerate or swap a signing key as part of a routine release. The certificate gate rejects keys that differ from the pinned release identity.

## Books and third-party assets

App source licensing does not grant rights to books users import or download.
Project Gutenberg titles are offered under its [terms and permissions](https://www.gutenberg.org/policy/permission.html); availability and copyright
status can vary by jurisdiction. Keep book fixtures synthetic or use material you
have permission to redistribute. Font packages and other dependencies retain
their own licenses.

## Obtainium

The website and README provide an Obtainium import link using the official redirect service. It tracks this repository’s tagged GitHub releases and filters assets to `^avido-[0-9]+\.[0-9]+\.[0-9]+\.apk$`, so the identical generic APK is not a second choice. No listing submission is required. Keep one release per version, a versioned APK attachment, monotonically increasing version codes, and the pinned signing identity. See the [official deep-link documentation](https://wiki.obtainium.imranr.dev/deep_links/).

## Google Play distribution

The owner selected GitHub Actions rather than an Expo/EAS account for store builds.
Run **Actions → Build Play Store bundle → Run workflow** on `main`.
`.github/workflows/play-bundle.yml` produces a private-key-signed Android App Bundle
(`avido-play.aab`), a matching verification APK, checksums and source/version metadata.
The artifact is retained for 14 days; download and back up accepted store builds.
The workflow checks the APK and AAB certificate against `.github/play-upload-signer.sha256`.

`AVIDO_STORE=play` selects **com.alexfdez.avido.play**. Existing direct-download
builds retain **com.alexfdez.avido** and their pinned certificate. QA retains
**com.alexfdez.avido.local**. This separation allows the existing APK and Play app
to coexist and avoids replacing an installation signed with Expo's public debug key.
Never upload an APK signed with the shared debug key to Play. A Play release fails
if its private upload key is missing. Google Play App Signing manages the eventual
distribution certificate separately from this upload certificate.

The Play upload key and credentials are backed up outside Git at
`~/.local/share/avido/play-signing/` with owner-only permissions. Keep another
secure, encrypted backup. GitHub stores only dedicated `PLAY_UPLOAD_KEYSTORE_BASE64`,
`PLAY_UPLOAD_KEYSTORE_PASSWORD`, `PLAY_UPLOAD_KEY_ALIAS`, and `PLAY_UPLOAD_KEY_PASSWORD`
Actions secrets; none are printed in workflow output. Never replace these as a
routine release action. They do not change the legacy APK secrets or certificate.

Play versions start at 1.0.0. Its independent workflow run number supplies the
monotonically increasing version code. Update the workflow's APP_VERSION for future
user-visible releases. Rerunning an already uploaded workflow needs a fresh run
number before uploading another binary.

### Moving an existing library

In the direct-download app, export **Profile → Progress backup** to a shared folder.
Install the Play edition alongside it, choose the same books folder, then import
that backup and review the replacement confirmation. Keep the original app until
the new edition resumes your books correctly. Books are not included in the JSON;
keep their original files. Never tell users to uninstall before exporting progress.

### Store preparation

Public policy URLs: `/es/privacy/` and `/en/privacy/` on the production website.
The app links to the device language's policy from Profile. `scripts/build-privacy.cjs`
is included by the website generator, requires no dependencies and must be updated
alongside changes to data handling. Public support/privacy email:
`apps_alejandro@proton.me`. The owner approved a free app without ads for ages 16+.
See `docs/play-store.md` for declarations, source evidence and remaining release gates.
