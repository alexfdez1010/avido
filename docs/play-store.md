# Google Play preparation

Owner decisions (20 October 2026): free, no ads or purchases; audience 16–17
and 18+; public support/privacy email `apps_alejandro@proton.me`.
Publisher: Alejandro Fernández Camello. Category: Books & Reference, app.
Play package: `com.alexfdez.avido.play`; legacy APK and QA keep their identities.

## Data safety evidence

Do not select "no data collected" just because the app has no login.
`src/lib/gutenberg.ts` sends catalogue searches and book/cover requests directly
to Project Gutenberg. Its [privacy policy](https://www.gutenberg.org/policy/privacy_policy.html)
states that server access logs include IP addresses and are retained for at most
60 days. This is not ephemeral-only processing. Profile and reading history remain
local; exported backups are user-directed local files and may be synchronized by
the selected file provider. No advertising, analytics or crash-reporting SDK is
integrated in the audited app source. Confirm the merged release manifest too.

Use a conservative declaration for optional Discover data:

| Data type | Handling | Purpose |
| --- | --- | --- |
| App activity: in-app search history | Collected by Gutenberg, optional, not ephemeral | App functionality |
| App activity: app interactions | Book/cover requests collected by Gutenberg, optional, not ephemeral | App functionality; Gutenberg's usage analysis |
| Device or other IDs | IP in Gutenberg access logs, optional, not ephemeral | App functionality; Gutenberg's usage analysis and quality assurance |

Declare the transfers to Gutenberg transparently. Google's user-initiated transfer
exception may exclude these from the "shared" label; choosing the conservative
shared declaration avoids promising that third parties receive nothing. Do not
declare IP-derived location without evidence it is inferred. Connections use HTTPS.
No accounts are created; account-deletion requirements do not apply. Do not claim
an independent security review, payment certification or developer access to
Gutenberg's deletion controls. Refer requests for its logs to its privacy policy.
The developer does not provide a remote deletion endpoint for local reading data.

Consult Google's [Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469)
when completing the current form. Recheck declarations whenever network services
or SDKs change. Public policies live at `/es/privacy/` and `/en/privacy/`.

## Content declarations

No restricted access/sign-in; no ads; no government affiliation; no financial
features; no health features; no user-to-user communication, user publishing,
gambling, purchases or subscriptions. Imported books and the Gutenberg catalogue
can contain mature text; answer the IARC questionnaire based on its actual
wording for a general-purpose reader with an online catalogue. Audience selection
is separate from the automatically assigned content rating. Do not invent an IARC
rating or claim that imported literature is content-filtered.

## Assets and listing

`store/google-play/listing.json` contains Spanish and English listing text.
`scripts/prepare-play-assets.py` packages real website Android screenshots as PNG,
a 512×512 icon and 1024×500 feature graphics. It uses the existing local fonts and
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
