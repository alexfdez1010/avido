# Google Play preparation

Owner decisions (20 October 2026): free, no ads or purchases; audience 16–17
and 18+; public support/privacy email `apps_alejandro@proton.me`.
Publisher: Alejandro Fernández Camello. Category: Books & Reference, app.
Play package: `com.apps_alejandro.avido`, fixed by the existing Play Console listing.
Legacy APK and QA keep their identities. The registered upload certificate was
downloaded from Play Console and matches the private upload key.

## Data safety evidence

The owner decided to exclude Discover **only from the Play edition** after the
copyright investigation. The signed Play app contains no catalogue, download
entrypoints or INTERNET/ACCESS_NETWORK_STATE permissions. App config embeds the
edition; the UI, direct route and network functions all enforce it. Unknown
metadata disables catalogue access. The CI gate inspects the built APK permissions.

For the Play edition, declare **no user data collected or shared**, **no account
creation**, **no ads**, and no independent security certification. Profile, books,
reading history and backups are processed locally. User-selected folder providers
and Android backups are separate OS/provider behavior. Support email and public
privacy links open external apps at the user's request. The public policy clearly
distinguishes the two editions. Recheck declarations whenever services change.

The GitHub APK still connects to Gutenberg; its catalogue requests and IP access
logs are **not** covered by the Play edition's no-collection declaration. See
`docs/privacy.md` and Gutenberg's own policy for that edition.

Consult Google's [Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469)
when completing the current form. Public policies live at `/es/privacy/` and
`/en/privacy/`.

## Content declarations

No restricted access/sign-in; no ads; no government affiliation; no financial
features; no health features; no user-to-user communication, user publishing,
gambling, purchases or subscriptions. The Play app bundles no books and offers no online content. Select "no" for
ratings-relevant content in the package, user-to-user sharing and online content.
Google explicitly excludes files users import themselves from the ratings
questionnaire: [Online Content guidance](https://support.google.com/googleplay/android-developer/answer/11070055).
The APK's catalogue must not be used to rate the offline Play edition. Audience
selection remains separate from the assigned rating.

## Assets and listing

`store/google-play/listing.json` contains Spanish and English listing text.
`scripts/prepare-play-assets.py` packages native Play screenshots as PNG, a
512×512 icon and localized 1024×500 feature graphics. Seven new phone captures
per language cover home, library, reader, statistics and achievements.
`store/google-play/source/provenance.json` records their exact source, APK SHA-256,
private signer, device, transformations and demonstration-data context.

All captures come from the unmodified, signed offline Play app, with three original
sample EPUBs imported through the system picker and a representative fictional
reading history restored through the actual backup UI. The app's own quest,
XP, level and achievement definitions calculate the fixture's values. No third-party
book text or cover images are used. Samples are not bundled in the distributed app
and the metrics do not represent user outcomes or proven habit effectiveness.
Captures are scaled proportionally, without cropping or retouching, and centered
on a 1080×1920 canvas. Regenerate with Python and Pillow. Old website screenshots
are not used for the Play listing. Tablet screenshots are not fabricated.

## Native verification (20 October 2026)

The signed offline capture build `03c3c00` (1.0.0, code 3, temporary package
`com.alexfdez.avido.play`) passed the local Android
reading-plan flow, including untimed reading, an optional 30-minute reminder and
returning to untimed reading. An explicit Discover deep link redirected to the
library. Folder import and backup restore ran through the actual Android UI.
English and Spanish privacy/support controls were checked, including enlarged
system text at 130%. Temporary settings were restored and the emulator closed.
The personal/legacy package was not modified. The repeatable reading-plan flow
is `.maestro/play-offline.yaml`, now targeting the registered Play package.
The store rejected the temporary package; the production config now uses the
existing listing identity. Screenshot UI and offline behavior are unchanged.

The full three-architecture bundle passed Google's bundletool validation,
JAR signature verification, pinned private-certificate comparison, package/version
checks and the forbidden-permission checks above. Native interactive coverage
was on Pixel 9 / Android 16, arm64; no tablet coverage is claimed. Local build
metadata, hashes and diagnostic logs are in the ignored `artifacts/android/play/`
folder. A fresh installation through Google Play still needs test-track validation.

## Play Console submission (20 October 2026)

Version **1.0.0 (5)**, package `com.apps_alejandro.avido`, was accepted by Play
Console and submitted with the English/Spanish listing and declarations to the
**Closed testing – Alpha** track. The original console submission showed **Changes in review**;
the initial submission was subsequently published to closed testing. The owner
then requested worldwide test availability (178 countries/regions, including
Rest of World). This country expansion has been saved and submitted
for review. Feedback goes to `apps_alejandro@proton.me`. No testers have been
assigned or opted in. Public production access remains locked until the real
12-tester / 14-day requirement and Google's production-access review are satisfied.
The owner has been asked to provide tester Google-account email addresses.

A fresh installation of the definitive signed APK from `982049e` passed all five
onboarding screens, home/library rendering, absence of Discover on both screens
and the explicit Discover deep-link redirect. This used the existing Pixel 9 AVD
headlessly, then shut it down. The previous reader/import/backup coverage above
precedes only the package-identity correction. Installation through Play itself
still needs a real tester. Maestro MCP's old connection was stale after shutdown;
the official local Maestro CLI ran the final native checks successfully.

The uploaded AAB SHA-256 is
`1342348163e6941c06d9ac1b0b48542f97202d3b86e4135478008eb839b6e28b`.
Local artifacts and detailed metadata are in `artifacts/android/play/registered-build.json`.
The Advertising ID declaration is **No**; the signed manifest excludes AD_ID.
Google's missing-deobfuscation-file warning is expected because this build has
R8/Proguard obfuscation disabled. Its other warning is the missing tester list.

## Release gates

1. Validate lint, typecheck, tests and signed bundle/APK. Verify the changed app
   on Android and inspect the binary permissions before upload.
2. Ensure public policy URLs return 200, then save them in Play Console.
3. Complete listing and content declarations; enable Play App Signing when
   creating the first release. The Play signing agreement must be accepted by
   the owner if Google presents legally binding terms.
4. Upload the AAB and release to the appropriate test track. Initial submission
   is through Play Console; no Google service-account credential is needed.
5. This account's dashboard requires at least 12 testers continuously opted in
   for 14 days. The owner must supply real testers and collect actual feedback.
   Never claim test participation or feedback that did not happen.
6. Apply for production access after the test qualifies, then submit the public
   release for Google's review. Production approval cannot be guaranteed.

Use `docs/releasing.md` for signing, build and progress-migration instructions.

The signed cloud build also passed all checks and artifact upload in
GitHub Actions run `39413031900` (`982049e`). The signer check supports both
numbered signer output and the current `V2 Signer:` format.
