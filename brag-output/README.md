# Ávido launch videos

22 seconds, landscape 1280×720, 30 fps, H.264/yuv420p + AAC, fast-start MP4. ES and EN use localized display text and genuine Android app screenshots. Source screenshots retain their original interface languages. The Today greeting is cropped out. No narration.

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

The poster is the settled product reveal at 5.8 seconds. Replacing only frame 0 preserves all 660 frames, duration and audio timing. The generator ends in Spanish so the checked-in `composition/index.html` remains the Spanish preview. The two `.vtt` files are manually authored companions; keep them synchronized if copy or scene timings change.

## Source files

- `build-composition.cjs`: both locales, layout and choreography; writes `composition/index.html`.
- `composition/index.html`: generated Spanish composition, ready for preview or render.
- `composition/hyperframes.json`: project configuration and workflow attribution.
- `composition/package.json`: optional pinned preview, check and render shortcuts.
- `composition/assets/`: the exact screenshots, fonts, local GSAP runtime, trimmed music and sound effects used by the render.
- `brag-plan.md`, `composition-brief.md`: storyboard, positioning and production decisions.
- `share-copy.txt`, `share-copy-variants.md`: share captions and audio attribution.

The composition is a self-contained Hyperframes project; generated agent instruction files and timestamp metadata are unnecessary and omitted. No dependencies or renderer caches are vendored.

## Verification

Both locale compositions pass Hyperframes 0.8.167 `check`: no lint, runtime, layout or contrast errors. Five settled timestamps inspected: 1.5, 5.8, 10.5, 15.2 and 20 seconds. Architecture warnings reflect this small, deliberately monolithic five-scene timeline and repeated still images; media is not duplicated during playback. The final MP4 is decoded and inspected separately.

Audio-reactive extraction was attempted with the official helper but NumPy was unavailable. Choreography uses the supplied music cue grid instead: major transitions at 8.74, 13.11 and 17.47 seconds. The bundled music asset already includes the 22-second trim, 0.4-second fade-in and 2-second fade-out. Composition playback volume is 0.30; sparse sound effects play at 0.55. No audio preprocessing dependency is needed for reproduction.

## Rights and attribution

See [video credits](../site/assets/video-credits.txt). Music is CC BY 4.0, verified at the artist's official track page. Keep that credit linked beside the website video, and include it with social uploads. Font license notices are bundled alongside the fonts. GSAP 3.14.2 retains its license header and is subject to [its standard license](https://gsap.com/standard-license/).

## Delivery and ignored output

Publish `site/assets/avido-launch-{es,en}.mp4`, `video-poster-{es,en}.jpg`, `avido-launch-{es,en}.vtt` and `video-credits.txt`. The `.vtt` files contain the timed on-screen messages and music cue; there is no spoken narration. A nearby text transcript should describe the real screenshot sequence: current book and daily goal, then the uncluttered reader.

This directory's `.gitignore` excludes raw MP4 files, duplicate posters, check reports, logs, QA frames, `node_modules/` and `.hyperframes/` history/cache. Local disk usage therefore exceeds the size of the source files committed to Git. Keep the ignored verification evidence local; it is unnecessary for reproduction.
