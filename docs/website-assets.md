# Website assets

The launch website uses the application's own icon and licensed typefaces. It
loads its fonts, screenshots, sharing images and videos from this repository;
there is no remote font service or website analytics script.

## Screenshots

- `site/assets/app-home.webp`: real Android screenshot captured on 2026-10-16
  during local verification, with a demonstration book and example progress.
- `site/assets/app-reader.webp`: real Android reader screenshot from the baseline
  verification, displaying Spanish sample reading content in the paper theme.

The files are resized versions of verification captures, not reconstructed UI.
They illustrate different reading states and are not evidence of effectiveness
or actual user metrics. Their provenance is preserved in adjacent JSON files.

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

The 22-second English and Spanish MP4 files use actual app screenshots, animated
typography and music, with no narration. Their opening frame matches the poster.
The website supplies caption tracks and a visible text transcript and does not
autoplay or preload the videos. The README links its poster to the matching
website player because GitHub does not reliably render repository-hosted HTML
video elements in Markdown.

The videos' music is CC BY 4.0 and the sound effects are CC0. Keep
`site/assets/video-credits.txt` linked beside the player and preserve its credits
when sharing the video. Video source and reproduction notes are in
`brag-output/README.md`.
