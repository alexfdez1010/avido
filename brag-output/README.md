# Ávido launch videos

33 seconds, landscape 1280×720, 30 fps, H.264/yuv420p + AAC, fast-start MP4. ES and EN use localized display text and genuine Android app screenshots. The duration was explicitly extended beyond the brag default at the user’s request. Phones occupy 652 of the 720 canvas pixels vertically, preserving the native portrait aspect. Every app screenshot is localized: the Spanish film uses the Spanish app and the English film uses the English app. Library, statistics, trophies, reader and home screens all appear at their native aspect ratio. No narration.

Home, statistics and trophies use a representative demonstration profile seeded in an isolated QA build at the user’s request. They are native app captures, not fabricated UI or real-user outcome claims. Library and reader contain real Gutenberg classics.

## Reproduce both website videos

Requires Node.js, npm, FFmpeg and a browser available to Hyperframes. The pinned CLI downloads its browser when needed. All animation, image, font and audio assets are included under `composition/assets/`; the installed brag skill and temporary Hyperframes documentation checkout are not required to reproduce the video.

Run this complete recipe from the repository root. It regenerates both MP4 files and their posters in `site/assets/`:

```sh
set -e
for locale in es en; do
  node brag-output/build-composition.cjs "$locale"
  (
    cd brag-output/composition
    DO_NOT_TRACK=1 npx --yes hyperframes@0.8.167 check
    DO_NOT_TRACK=1 npx --yes hyperframes@0.8.167 render \
      --quality delivery --fps 30 --workers 2 \
      --output "../raw-${locale}.mp4"
  )
  ffmpeg -hide_banner -loglevel error -y -ss 5.8 \
    -i "brag-output/raw-${locale}.mp4" -frames:v 1 -q:v 2 \
    "site/assets/video-poster-${locale}.jpg"
  ffmpeg -hide_banner -loglevel error -y \
    -i "brag-output/raw-${locale}.mp4" \
    -i "site/assets/video-poster-${locale}.jpg" \
    -filter_complex "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]" \
    -map '[v]' -map '0:a?' -c:v libx264 -crf 20 -preset slow \
    -pix_fmt yuv420p -c:a copy -movflags +faststart \
    "site/assets/avido-launch-${locale}.mp4"
done
node brag-output/build-composition.cjs es
```

The poster is the settled product reveal at 5.8 seconds. Replacing only frame 0 preserves all 990 frames, duration and audio timing. The generator ends in Spanish so the checked-in `composition/index.html` remains the Spanish preview. There are no subtitle tracks, slide counters, separators or secondary instructional labels. Main marketing headlines remain; each app screen has its own generous beat.

## Source files

- `build-composition.cjs`: both locales, layout and choreography; writes `composition/index.html`.
- `composition/index.html`: generated Spanish composition, ready for preview or render.
- `composition/hyperframes.json`: project configuration and workflow attribution.
- `composition/package.json`: optional pinned preview, check and render shortcuts.
- `composition/assets/screenshots/{es,en}/`: seven localized screenshots per language (`home`, `library`, `stats`, `trophies`, `reader`, `stats-details`, `trophies-details`), copied from `site/assets/screenshots/` after capture. Statistics and trophies crossfade to their detail views at 11.1 and 16.2 seconds.
- `composition/assets/`: fonts, local GSAP runtime, trimmed music and sound effects used by the render.
- `brag-plan.md`, `composition-brief.md`: storyboard, positioning and production decisions.
- `share-copy.txt`, `share-copy-variants.md`: share captions and audio attribution.

The composition is a self-contained Hyperframes project; generated agent instruction files and timestamp metadata are unnecessary and omitted. No dependencies or renderer caches are vendored.

## Verification

Both locale compositions pass Hyperframes 0.8.167 `check`: no lint, runtime, layout or contrast errors. Scene and detail proof times: 1.5, 5.8, 10, 12, 15, 17.5, 21, 26 and 31 seconds. Architecture warnings reflect this small, deliberately monolithic seven-scene timeline. The final MP4 is decoded and inspected separately.

Audio-reactive extraction was attempted with the official helper but NumPy was unavailable. Choreography uses the supplied music cue grid instead: scene entries at 2.73, 8.19, 13.64, 18.56 and 23.46 seconds. The bundled music asset already includes the 33-second trim, 0.4-second fade-in and 2-second fade-out. Composition playback volume is 0.30; sparse sound effects play at 0.55. No audio preprocessing dependency is needed for reproduction.

To deliberately refresh screenshot assets from a new native capture before generating the HTML, copy both locale folders from `site/assets/screenshots/` into `brag-output/composition/assets/screenshots/`. The render itself reads only these bundled copies, so future website screenshot edits do not silently change the film.

## Rights and attribution

See [video credits](../site/assets/video-credits.txt). Music is CC BY 4.0, verified at the artist's official track page. Keep that credit linked beside the website video, and include it with social uploads. Font license notices are bundled alongside the fonts. GSAP 3.14.2 retains its license header and is subject to [its standard license](https://gsap.com/standard-license/).

## Delivery and ignored output

Publish `site/assets/avido-launch-{es,en}.mp4`, `video-poster-{es,en}.jpg` and `video-credits.txt`. There is no spoken narration or subtitle track. The screenshot sequence is library, statistics, trophies, home and reader.

This directory's `.gitignore` excludes raw MP4 files, duplicate posters, check reports, logs, QA frames, `node_modules/` and `.hyperframes/` history/cache. Local disk usage therefore exceeds the size of the source files committed to Git. Keep the ignored verification evidence local; it is unnecessary for reproduction.
