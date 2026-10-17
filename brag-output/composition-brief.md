# Hyperframes composition brief

Create the 22-second, bilingual Ávido launch film described in brag-plan.md. Sources: site/index.html, site/assets/styles.css, README.md, scripts/build-site.cjs, real screenshots site/assets/app-home.webp and app-reader.webp. Use the source palette and local fonts. Creative premise: reclaim attention from profitable scrolling and put reading progress first. No outcome guarantees, no encrypted-vault claims, no fabricated screen UI.

Use one paused, seekable GSAP timeline, five timed scenes, local assets, 1280×720 at 30 fps. Subject poses: phone enters from right/left at 0.96 scale, settles at 1; subtle push-in across the hold; headlines enter with fast vertical motion and long settled holds. Preserve real screenshots with intentional viewport cropping. Strong music cue transitions at 8.74, 13.11 and 17.47. Exact SFX chosen after choreography: low-HF soft impacts and one quiet tap.

Audio: bundled vol-12 music at 0.30, trimmed/faded before rendering; SFX at 0.55. Source cue metadata is bundled with brag at assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json. Official audio-reactive helper attempted; NumPy unavailable, so omit reactive extraction. No narration.

Delivery: check each locale including runtime/layout/contrast, inspect settled and transitional frames, render H.264 MP4, extract strongest settled product reveal at 5.8 seconds as poster, replace only frame 0 with that poster. Site assets avido-launch-es.mp4 and avido-launch-en.mp4 plus video-poster-es.jpg and video-poster-en.jpg. Keep source and reproducibility notes; exclude raw render/caches from Git.
