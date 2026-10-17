# Website assets

The launch website uses the application's own icon and licensed typefaces. It
loads its fonts, screenshots, sharing images and videos from this repository;
there is no remote font service or website analytics script.

## Screenshots

`site/assets/screenshots/es/` and `site/assets/screenshots/en/` each contain seven
native Android captures: `home`, `library`, `stats`, `stats-details`, `trophies`,
`trophies-details` and `reader`. Each locale was selected inside the app before
capture. The published WebP files are resized from 1080 × 2424 to 540 × 1212;
their interface and figures were not painted or reconstructed.

The books contain the actual Project Gutenberg EPUB text, metadata and covers:

- [Don Quijote](https://www.gutenberg.org/ebooks/2000)
- [El crimen y el castigo](https://www.gutenberg.org/ebooks/61851)
- [Crime and Punishment](https://www.gutenberg.org/ebooks/2554)

The reader shows Crime and Punishment in Spanish or English. Other
screens show a representative demonstration history, calculated by the app's
own stores and statistics: 120 days of history, a 42-day streak, 25 unlocked
achievements and an annual goal with eight of twelve books completed. These
figures illustrate the interface; they are not actual user results or evidence
of habit effectiveness.

The capture used the isolated local QA application, based on commit
`e8ed41f358287ead93c804227bab872691835de7` (version 1.0.23), with a temporary
JavaScript entrypoint that seeded the demonstration data. Production sources
and native code were unchanged; that entrypoint is not distributed. Adjacent
JSON files record the base APK, temporary bundle, locale and source provenance.
The original QA APK was restored after capture.

## Identity and fonts

`site/assets/icon.png` comes from `assets/images/icon.png`.
Fraunces and Bricolage Grotesque come from the application's installed
`@expo-google-fonts` packages. Their font license texts are included in
`site/assets/fonts/` and apply independently of the project's MIT license.

## Social images

`og-es.png` and `og-en.png` are original 1200 × 630 sharing compositions made from
the existing identity, typefaces and actual Today screenshot. To regenerate them,
use Python with Pillow installed:

```sh
python3 scripts/generate-social-images.py
```

Each image includes provenance metadata. After replacing an image, check its
localized Open Graph alternative text and rerun the website checks.

## Launch videos

The 33-second English and Spanish MP4 files use these localized app screenshots,
animated typography and music, with no narration. A tall portrait phone gives
the interface most of the canvas height. There are no subtitle tracks, scene
counters or secondary scene labels. The website uses native playback controls
without autoplay or preloading. The README links its poster to the matching
website player because GitHub does not reliably render repository-hosted HTML
video elements in Markdown.

The website groups the film and screenshot carousel in the same product showcase.
The carousel supports touch scrolling, previous/next controls and keyboard
navigation; it does not advance automatically.

The videos' music is CC BY 4.0 and the sound effects are CC0. Keep
`site/assets/video-credits.txt` linked beside the player and preserve its credits
when sharing the video. Video source and reproduction notes are in
`brag-output/README.md`.
