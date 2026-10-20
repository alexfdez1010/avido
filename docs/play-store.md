# Google Play preparation

Owner decisions (20 October 2026): free, no ads or purchases; audience 16–17
and 18+; public support/privacy email `apps_alejandro@proton.me`.
Publisher: Alejandro Fernández Camello. Category: Books & Reference, app.
Play package: `com.alexfdez.avido.play`; legacy APK and QA keep their identities.

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
`scripts/prepare-play-assets.py` packages real website Android screenshots as PNG,
a 512×512 icon and 1024×500 feature graphics. Play screenshots use reader, statistics
and achievements screens; home/library images showing Discover are excluded. It uses the existing local fonts and
icon; it does not paint UI or invent screenshots. Captures are scaled without
cropping or distortion and centered on a 1080×1920 canvas to meet Play's aspect
ratio limits. Upscaling does not add source detail. Original provenance remains in
the adjacent `site/assets/screenshots/*/*.webp.json` files. Regenerate with Python
and Pillow. The main listing supports phone screenshots only; tablet artwork is
not fabricated. Do not describe the app as already available on Play before approval.

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
