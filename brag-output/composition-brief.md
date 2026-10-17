# Hyperframes composition brief

Create the bilingual, 33-second Ávido launch film in brag-plan.md. The user explicitly requested a longer cut, taller phones, more product depth, no subtitles and no slide counters or secondary instructional copy. This overrides the default brag duration. Sources: project site palette and typography, plus newly captured native images under site/assets/screenshots/{es,en}/{home,library,stats,trophies,reader}.webp.

Each language uses only its corresponding app captures. The library contains real classics with their covers, including Don Quijote and El crimen y el castigo / Crime and Punishment. Reader text is the real first chapter in the matching language. Home, statistics and trophies show a user-authorized demonstration progress profile captured inside the actual QA app. No old sample-book asset is allowed, and missing localized files fail generation.

Use one paused, seekable GSAP timeline with seven timed scenes. 1280×720 at 30 fps, 33 seconds / 990 frames. Five product beats use one 296×652 portrait phone each, preserving native screenshot aspect without cropping or squashing. Brand and a large meaningful headline occupy the left side. Fast entrances, generous settled holds, restrained camera motion. No .rule, .folio, .label or subtitle elements; no external caption tracks.

Audio: same bundled Sascha Ende vol-12 track, 33-second excerpt with opening and closing fades, level0.30. Soft impacts at library reveal, reader reveal and outro, level0.55. No narration. CC BY 4.0 attribution remains linked beside website playback.

Within the statistics and trophies beats, crossfade at 11.1 and 16.2 seconds to the matching native `stats-details.webp` and `trophies-details.webp` captures. These show hourly and weekday activity, per-book totals, the streak grid and unlocked badge icons without shortening the main scene holds.

Delivery: browser check in both locales, inspect all seven scenes, render H.264/yuv420p+AAC with faststart. Extract settled library reveal at5.8 seconds and bake it into frame0. Final site assets remain avido-launch-es.mp4, avido-launch-en.mp4, video-poster-es.jpg and video-poster-en.jpg. VTT files removed at the user's request. Keep local source, media, licensing and exact reproduction commands; ignore renders, caches and QA frames.
