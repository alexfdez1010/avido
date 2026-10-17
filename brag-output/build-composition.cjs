const fs = require('node:fs');
const path = require('node:path');
const lang = process.argv[2] || 'es';
if (!['es', 'en'].includes(lang)) throw new Error('Expected es or en');
for (const screen of ['home', 'library', 'stats', 'trophies', 'reader']) {
  const asset = path.join(__dirname, 'composition/assets/screenshots', lang, `${screen}.webp`);
  if (!fs.existsSync(asset)) throw new Error(`Missing localized screenshot: ${asset}`);
}
const detailScreens = ['stats', 'trophies'].filter(screen =>
  fs.existsSync(path.join(__dirname, 'composition/assets/screenshots', lang, `${screen}-details.webp`))
);
const copy = {
  es: {
    hook: ['Ellos ganan', 'con tu scroll'],
    library: ['Tu próximo', 'vicio se lee'],
    stats: ['Mira cuánto', 'has avanzado'],
    trophies: ['Cada página', 'cuenta'],
    home: ['Tu próxima', 'historia', 'te espera'],
    reader: ['Tú, el libro', 'y nada más'],
    outro: 'Recupera tu atención',
    cta: 'Descargar para Android',
  },
  en: {
    hook: ['They profit', 'from your scroll'],
    library: ['Your next', 'obsession', 'has pages'],
    stats: ['See how far', "you’ve come"],
    trophies: ['Every page', 'counts'],
    home: ['Your next', 'story', 'is waiting'],
    reader: ['You, the book', 'and nothing else'],
    outro: 'Reclaim your attention',
    cta: 'Download for Android',
  },
}[lang];
const scenes = [
  { id: 'library', start: 2.73, end: 8.19, theme: 'paper' },
  { id: 'stats', start: 8.19, end: 13.64, theme: 'dark' },
  { id: 'trophies', start: 13.64, end: 18.56, theme: 'paper' },
  { id: 'home', start: 18.56, end: 23.46, theme: 'dark' },
  { id: 'reader', start: 23.46, end: 29, theme: 'paper' },
];
const lines = items => items.map(text => `<span class="line">${text}</span>`).join('');
const appScene = ({ id, start, end, theme }) => `
  <section id="${id}" class="clip ${theme} app-scene" data-start="${start}" data-duration="${(end - start).toFixed(2)}" data-track-index="0">
    <div class="brand">ávido</div>
    <div class="copy"><h2>${lines(copy[id])}</h2></div>
    <div class="phone" data-layout-allow-overflow>
      <div class="screen"><img class="base-screen" src="assets/screenshots/${lang}/${id}.webp" alt="Ávido ${id}" />${detailScreens.includes(id) ? `<img class="detail-screen" src="assets/screenshots/${lang}/${id}-details.webp" alt="Ávido ${id} detail" />` : ''}</div>
    </div>
  </section>`;
const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>Ávido launch — ${lang}</title>
  <script src="assets/gsap.min.js"></script>
  <style>
    @font-face{font-family:Fraunces;src:url('assets/fonts/fraunces-black.ttf');font-weight:900}
    @font-face{font-family:Bricolage;src:url('assets/fonts/bricolage-bold.ttf');font-weight:700}
    *{box-sizing:border-box}
    body{margin:0;color:#171811;background:#171811;font-family:Bricolage,sans-serif}
    #root{position:relative;width:100%;height:100%;overflow:hidden}
    .clip{position:absolute;inset:0;overflow:hidden}
    .paper{background:#f3ede2}
    .dark{background:#171811;color:#f3ede2}
    .brand{position:absolute;left:70px;top:43px;font-family:Fraunces,serif;font-size:44px;line-height:1.1;letter-spacing:-2px}
    .copy{position:absolute;left:70px;top:225px;width:770px}
    h1,h2,p{margin:0}
    h1,h2{font-family:Fraunces,serif;font-weight:900;letter-spacing:-4px;line-height:1.04}
    .line{display:block}
    .app-scene h2{font-size:98px}
    .app-scene .line:last-child{color:#145b38}
    .dark.app-scene .line:last-child{color:#3dd68c}
    .phone{position:absolute;top:34px;right:70px;width:296px;height:652px;padding:6px;background:#23241e;border-radius:29px;box-shadow:12px 13px 0 rgba(20,91,56,.14);overflow:hidden}
    .dark .phone{background:#4c4e42;box-shadow:12px 13px 0 rgba(61,214,140,.11)}
    .screen{position:relative;width:100%;height:100%;overflow:hidden;border-radius:23px;background:#0f100c}
    .screen img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain;object-position:center}
    .detail-screen{opacity:0}
    #hook .copy{top:223px;width:1140px}
    #hook h1{font-size:116px}
    #hook .line:last-child{color:#3dd68c}
    #home .copy{top:185px}
    #home h2{font-size:99px}
    #reader h2{font-size:${lang === 'en' ? 84 : 97}px}
    #library .copy{top:${lang === 'en' ? 195 : 245}px}
    #library h2{font-size:${lang === 'en' ? 97 : 104}px}
    #outro .copy{top:147px;width:1140px}
    #outro h2{font-size:168px;color:#3dd68c;letter-spacing:-8px}
    #outro .headline{font-family:Fraunces,serif;font-weight:900;font-size:62px;letter-spacing:-2px;line-height:1.15;margin-top:20px}
    #outro .cta{display:inline-block;margin-top:41px;padding:21px 30px;background:#3dd68c;color:#171811;font-size:27px;font-weight:700}
  </style>
</head>
<body>
<div id="root" data-composition-id="avido" data-start="0" data-width="1280" data-height="720" data-duration="33">
  <section id="hook" class="clip dark" data-start="0" data-duration="2.73" data-track-index="0">
    <div class="brand">ávido</div>
    <div class="copy"><h1>${lines(copy.hook)}</h1></div>
  </section>
  ${scenes.map(appScene).join('\n')}
  <section id="outro" class="clip dark" data-start="29" data-duration="4" data-track-index="0">
    <div class="copy"><h2>ávido</h2><p class="headline">${copy.outro}</p><p class="cta">${copy.cta}</p></div>
  </section>
  <audio id="music" src="assets/music/bed.mp3" data-start="0" data-duration="33" data-track-index="10" data-volume="0.30"></audio>
  <audio id="hit-library" src="assets/sfx/impactSoft_medium_001.ogg" data-start="2.73" data-duration="0.18" data-track-index="11" data-volume="0.55"></audio>
  <audio id="hit-reader" src="assets/sfx/impactSoft_medium_001.ogg" data-start="23.46" data-duration="0.18" data-track-index="11" data-volume="0.55"></audio>
  <audio id="hit-outro" src="assets/sfx/impactSoft_medium_001.ogg" data-start="29" data-duration="0.18" data-track-index="11" data-volume="0.55"></audio>
</div>
<script>
  const tl = gsap.timeline({ paused: true });
  tl.fromTo('#hook .line', { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: .43, stagger: .10, ease: 'power3.out' }, .04);
  const scenes = ${JSON.stringify(scenes)};
  for (const { id, start, end } of scenes) {
    // Beat-grid scene entries: 2.73, 8.19, 13.64, 18.56, 23.46 seconds.
    tl.fromTo('#' + id + ' .line', { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .08, ease: 'power3.out' }, start + .04);
    tl.fromTo('#' + id + ' .phone', { x: 65, rotation: 1, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, duration: .6, ease: 'power2.out' }, start + .02);
    tl.to('#' + id + ' .phone', { y: -4, scale: 1.005, duration: end - start - .72, ease: 'sine.inOut' }, start + .65);
  }
  const detailScreens = ${JSON.stringify(detailScreens)};
  for (const id of detailScreens) {
    const at = id === 'stats' ? 11.1 : 16.2;
    tl.to('#' + id + ' .base-screen', { opacity: 0, duration: .22, ease: 'power1.inOut' }, at);
    tl.fromTo('#' + id + ' .detail-screen', { opacity: 0 }, { opacity: 1, duration: .22, ease: 'power1.inOut' }, at);
  }
  tl.fromTo('#outro .copy', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' }, 29.05);
  window.__timelines['avido'] = tl;
</script>
</body>
</html>`;
fs.writeFileSync(path.join(__dirname, 'composition/index.html'), html.replace(/[ \t]+$/gm, ''));
