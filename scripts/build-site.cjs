const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../site');
const origin = 'https://alexfdez1010.github.io/avido/';
const repo = 'https://github.com/alexfdez1010/avido';
const download = `${repo}/releases/latest/download/avido.apk`;
const copy = {
  es: {
    title: 'Ávido — Engánchate a los libros. Recupera tu atención.',
    description: 'Cambia el scroll por un capítulo más. Ávido es un lector Android de código abierto con rachas, misiones y progreso local. Sin anuncios ni cuenta. Descarga el APK.',
    nav: ['La idea', 'El lector', 'Privacidad', 'Instalar'],
    headline: 'Tu próximo <span class="headline-ending">vicio se <em>lee</em></span>',
    intro: 'Un lector de Android para cambiar «cinco minutos de scroll» por «un capítulo más». Tus libros, pequeños retos y ganas de volver.',
    primary: 'Descargar para Android', source: 'Ver el código', micro: 'Gratis · Código abierto · Sin cuenta',
    manifesto: 'El truco es<br>el mismo<br><em>Ahora ganas tú</em>',
    body: 'Silicon Valley aprendió a hacer que volvieras una y otra vez. Las rachas, las recompensas y ese pequeño impulso de «solo un poco más» convirtieron tu atención en su negocio.',
    body2: '¿Y si esas ganas de volver fueran para leer? Ávido pone los retos, las rachas y las recompensas al servicio de tus libros. Cada sesión suma progreso, XP y motivos para continuar donde lo dejaste.',
    switchTitle: 'Cambia quién gana.', modes: ['El negocio del scroll', 'Tu hábito lector'],
    loopLabels: ['La señal', 'La acción', 'La recompensa'],
    loops: [['Una notificación', 'Otro rato en el feed', 'Más atención para la plataforma'], ['Tu libro te espera', 'Unas páginas, a tu ritmo', 'Una historia que avanza contigo']],
    loopNote: 'Que las ganas de volver te lleven a una historia que tú elegiste. Tú decides cuándo empezar y cuándo parar.',
    featuresTitle: 'Abre un libro<br><em>Encuentra tu ritmo</em>',
    features: [
      ['Todos tus libros en su sitio', 'Elige una carpeta y lee EPUB, PDF, TXT o Markdown. Tu posición se guarda para volver justo donde lo dejaste.'],
      ['Progreso que se siente.', 'XP, niveles, rachas con comodines, tres misiones diarias y 32 logros. Un pequeño empujón para esa gran historia.'],
      ['Cómodo, a tu manera.', 'Cuatro tipografías de lectura, seis temas, ajustes de tamaño y márgenes. Modo e-ink y lectura sin controles visibles.'],
      ['Siempre hay otro libro.', 'Descubre clásicos con Project Gutenberg. Descárgalos y sigue leyendo sin conexión. Comprueba sus derechos en tu país.']
    ],
    galleryTitle: 'Elige cómo leer',
    gallery: ['Retoma tu libro y consulta tu objetivo diario', 'Ajusta la letra, los márgenes y el tema'],
    privacyTitle: 'Tu biblioteca<br><em>Tu vida privada</em>',
    privacyIntro: 'Una biblioteca necesita libros. No necesita un perfil publicitario sobre ti.',
    privacy: [['Sin cuenta.', 'Abre la app y lee. Sin registro ni inicio de sesión.'], ['Sin anuncios ni rastreadores', 'Sin interrupciones para venderte algo. Sin medir tus lecturas para hacer negocio con ellas.'], ['Progreso en tu dispositivo.', 'Tus libros, tu posición y tus logros se quedan en el dispositivo. No necesitas entregarlos a una nube para disfrutar de ellos.']],
    privacyFine: 'Para buscar y descargar clásicos, Descubrir necesita conectarse a servicios externos. Consulta la guía si quieres conocer todos los detalles sobre datos, permisos y copias del dispositivo.',
    privacyLink: 'Lee cómo funciona la privacidad',
    installTitle: 'Tu próximo capítulo<br><em>empieza aquí.</em>',
    installIntro: 'La descarga es un archivo APK que se instala directamente en tu móvil Android.',
    steps: [['Descarga el APK', 'Pulsa Descargar para Android. Si el navegador te pregunta, confirma que quieres guardar avido.apk.'], ['Ábrelo e instala', 'Abre el archivo descargado. Si Android lo pide, entra en Ajustes y permite instalar desde ese navegador o gestor de archivos. Vuelve y pulsa Instalar. Puedes quitar ese permiso después.'], ['Elige tus libros', 'Abre Ávido y selecciona tu carpeta de libros. ¿Todavía no tienes ninguno? Entra en Descubrir para buscar clásicos.']],
    releaseLink: 'Ver todas las versiones',
    faqTitle: 'Antes de pasar página.',
    faqs: [['¿Es gratis de verdad?', 'Sí. El código se publica con licencia MIT. Puedes usarlo, estudiarlo, modificarlo y contribuir. Los libros tienen sus propios derechos.'], ['¿Funciona sin internet?', 'Puedes leer los libros que ya tienes en el dispositivo sin conexión. Buscar y descargar libros en Descubrir sí necesita internet.'], ['¿Tengo que mantener una racha?', 'Tú decides cómo leer. La lectura empieza sin temporizador; puedes elegir un aviso de 5, 15 o 30 minutos. Los logros acompañan tu progreso, no bloquean el lector.'], ['¿Y para iPhone?', 'De momento, Ávido está disponible para Android.'], ['¿Cómo actualizo?', 'Descarga la nueva versión e instálala sobre la anterior. Evita desinstalar para conservar tu progreso. Si Android no acepta la actualización, consulta las notas de esa versión.']],
    closing: 'Que tu próxima<br>obsesión tenga <em>páginas.</em>',
    contribute: 'Contribuir', license: 'Licencia MIT', skip: 'Saltar al contenido', lang: 'Idioma', compare: 'Comparar el objetivo del hábito',
    og: 'Ávido. Que te atrape un buen libro. Lector Android de código abierto.',
  },
  en: {
    title: 'Ávido — Get hooked on books. Reclaim your attention.',
    description: 'Trade the endless scroll for one more chapter. Ávido is an open source Android reader with streaks, quests and local progress. No ads or account. Download the APK.',
    nav: ['The idea', 'The reader', 'Privacy', 'Install'],
    headline: 'Your next obsession <em class="headline-ending">has pages</em>',
    intro: 'An Android reader for trading five minutes of scrolling for one more chapter. Your books, little challenges and a reason to come back.',
    primary: 'Download for Android', source: 'Explore the code', micro: 'Free · Open source · No account',
    manifesto: 'Same tricks<br>New winner<br><em>You</em>',
    body: 'Silicon Valley learned how to keep you coming back. Streaks, rewards and that little urge for just a bit more turned your attention into their business.',
    body2: 'What if that urge brought you back to a book? Ávido puts challenges, streaks and rewards to work for your reading. Each session adds progress, XP and a reason to pick up where you left off.',
    switchTitle: 'Change who wins.', modes: ['The scroll business', 'Your reading habit'],
    loopLabels: ['The cue', 'The action', 'The reward'],
    loops: [['A notification', 'Another stretch in the feed', 'More attention for the platform'], ['Your book is waiting', 'A few pages, at your pace', 'A story that moves with you']],
    loopNote: 'Let the urge to come back lead to a story you chose. You decide when to start and when to stop.',
    featuresTitle: 'Open a book<br><em>Find your rhythm</em>',
    features: [
      ['All your books in one place', 'Choose a folder and read EPUB, PDF, TXT or Markdown. Your position is saved so you can pick up where you left off.'],
      ['Progress you can feel.', 'XP, levels, streak freezes, three daily quests and 32 achievements. A little encouragement for that big story.'],
      ['Comfort, on your terms.', 'Four reading typefaces, six themes, adjustable type and margins. E-ink mode and reading with the controls out of sight.'],
      ['Always another book.', 'Discover classics through Project Gutenberg. Download them, then keep reading offline. Check their copyright status in your country.']
    ],
    galleryTitle: 'Make yourself comfortable',
    gallery: ['Pick up your book and check your daily goal', 'Set your type, margins and reading theme'],
    privacyTitle: 'Your library<br><em>Your private life</em>',
    privacyIntro: 'A library needs books. It doesn’t need an advertising profile of you.',
    privacy: [['No account.', 'Open the app and read. No sign-up or sign-in.'], ['No ads or trackers', 'No interruptions to sell you something. No tracking your reading to turn it into a business.'], ['Progress on your device.', 'Your books, your place and your achievements stay on your device. You don’t have to hand them to a cloud to enjoy them.']],
    privacyFine: 'Finding and downloading classics through Discover connects to external services. The guide explains the full details of data, permissions and device backups.',
    privacyLink: 'Read how privacy works',
    installTitle: 'Your next chapter<br><em>starts here.</em>',
    installIntro: 'The download is an APK file that installs directly on your Android device.',
    steps: [['Download the APK', 'Tap Download for Android. If your browser asks, confirm that you want to save avido.apk.'], ['Open it and install', 'Open the downloaded file. If Android asks, go to Settings and allow installs from that browser or file manager. Return and tap Install. You can turn that permission off afterwards.'], ['Choose your books', 'Open Ávido and select your books folder. No books yet? Head to Discover to find a classic.']],
    releaseLink: 'Browse all versions',
    faqTitle: 'Before you turn the page.',
    faqs: [['Is it really free?', 'Yes. The source is released under the MIT license. Use it, study it, change it, contribute. Books have their own copyright terms.'], ['Does it work offline?', 'You can read books already on your device without an internet connection. Searching and downloading in Discover requires internet.'], ['Do I have to keep a streak?', 'You decide how to read. Reading starts without a timer; you can choose a 5, 15 or 30 minute reminder. Achievements accompany your progress without blocking the reader.'], ['What about iPhone?', 'Ávido is currently available for Android.'], ['How do I update?', 'Download the new version and install it over the existing app. Avoid uninstalling to keep your progress. If Android won’t accept the update, check that version’s release notes.']],
    closing: 'Let your next<br>obsession have <em>pages.</em>',
    contribute: 'Contribute', license: 'MIT license', skip: 'Skip to content', lang: 'Language', compare: 'Compare the goal of the habit',
    og: 'Ávido. Get hooked on a good book. Open source Android reader.',
  }
};
const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const down = '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
function render(lang, isRoot = false) {
  const c = structuredClone(copy[lang]);
  const unstop = text => text.replace(/\.(?=<|$)/g, '');
  for (const key of ['headline', 'manifesto', 'switchTitle', 'featuresTitle', 'galleryTitle', 'privacyTitle', 'installTitle', 'faqTitle', 'closing']) c[key] = unstop(c[key]);
  for (const key of ['features', 'privacy', 'steps']) c[key] = c[key].map(([heading, text]) => [unstop(heading), text]);
  c.gallery = c.gallery.map(unstop);
  const prefix = isRoot ? './' : '../';
  const canonical = isRoot ? origin : `${origin}${lang}/`;
  const assets = `${prefix}assets/`;
  const image = `${origin}assets/og-${lang}.png`;
  const button = `<a class="button" href="${download}">${down}${c.primary}</a>`;
  const video = {
    title: lang === 'es' ? 'Un capítulo más empieza en 22 segundos' : 'Your next chapter starts in 22 seconds',
    transcript: lang === 'es' ? 'Ver el contenido del vídeo' : 'Read the video transcript',
    text: lang === 'es' ? 'Ellos ganan con tu scroll. Tu próximo vicio se lee. Ávido muestra tu libro actual y tu objetivo diario en una captura real de Android. Una página más: rachas, misiones y XP. Tú, el libro y nada más: lectura sin anuncios y sin cuenta. Recupera tu atención con Ávido para Android, gratis y de código abierto.' : 'They profit from your scroll. Your next obsession has pages. Ávido shows your current book and daily goal in a real Android screenshot. One more page: streaks, quests and XP. You, the book and nothing else: reading without ads or an account. Reclaim your attention with Ávido for Android, free and open source.',
    credits: lang === 'es' ? 'Música y créditos' : 'Music and credits',
    fallback: lang === 'es' ? 'Descargar el vídeo' : 'Download the video',
  };
  const schema = {'@context':'https://schema.org','@graph':[
    {'@type':'WebSite','@id':`${origin}#website`,name:'Ávido',url:origin,inLanguage:['es','en']},
    {'@type':'VideoObject',name:video.title,description:video.text,thumbnailUrl:`${origin}assets/video-poster-${lang}.jpg`,contentUrl:`${origin}assets/avido-launch-${lang}.mp4`,uploadDate:'2026-10-17T07:48:42Z',duration:'PT22S',inLanguage:lang,caption:video.text},
    {'@type':'SoftwareApplication',name:'Ávido',operatingSystem:'Android',applicationCategory:'BooksApplication',url:canonical,downloadUrl:download,license:`${repo}/blob/main/LICENSE`,description:c.description,inLanguage:['es','en'],isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'EUR'},image,screenshot:`${origin}assets/app-home.webp`}
  ]};
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(c.title)}</title>
<meta name="description" content="${escape(c.description)}">
<meta name="theme-color" content="#f3ede2">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="es" href="${origin}es/">
<link rel="alternate" hreflang="en" href="${origin}en/">
<link rel="alternate" hreflang="x-default" href="${origin}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ávido">
<meta property="og:title" content="${escape(c.title)}">
<meta property="og:description" content="${escape(c.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${lang === 'es' ? 'es_ES' : 'en_GB'}">
<meta property="og:locale:alternate" content="${lang === 'es' ? 'en_GB' : 'es_ES'}">
<meta property="og:image" content="${image}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(c.og)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(c.title)}">
<meta name="twitter:description" content="${escape(c.description)}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${escape(c.og)}">
<link rel="icon" href="${assets}icon.png" type="image/png">
<link rel="preload" href="${assets}fonts/fraunces-black.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="${assets}styles.css">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
${isRoot ? '<script src="./assets/language.js"></script>' : ''}
<script src="${assets}site.js" defer></script>
</head>
<body data-language="${lang}">
<a class="skip-link" href="#main">${c.skip}</a>
<header class="masthead wrap">
<a class="brand" href="${isRoot ? './' : '../'}" aria-label="Ávido"><img src="${assets}icon.png" width="40" height="40" alt="">ávido</a>
<nav aria-label="${lang === 'es' ? 'Navegación principal' : 'Main navigation'}"><a href="#idea">${c.nav[0]}</a><a href="#reader">${c.nav[1]}</a><a href="#privacy">${c.nav[2]}</a><a class="nav-install" href="#install">${c.nav[3]} ${arrow}</a></nav>
<div class="languages" role="group" aria-label="${c.lang}"><a href="${prefix}es/" lang="es" hreflang="es"${lang === 'es' ? ' aria-current="page"' : ''}>ES</a><span aria-hidden="true">/</span><a href="${prefix}en/" lang="en" hreflang="en"${lang === 'en' ? ' aria-current="page"' : ''}>EN</a></div>
</header>
<main id="main">
<section class="hero wrap" aria-labelledby="hero-heading">
<div class="hero-copy"><h1 id="hero-heading">${c.headline}</h1><p class="intro">${c.intro}</p><div class="hero-actions">${button}<a class="text-link" href="${repo}">${c.source} ${arrow}</a></div><p class="micro">${c.micro}</p></div>
<figure class="hero-figure"><img class="app-shot" src="${assets}app-home.webp" alt="${lang === 'es' ? 'Inicio de Ávido: libro actual, progreso y opciones para leer sin temporizador o con un aviso.' : 'Ávido home: current book, reading progress and options for untimed reading or a reminder.'}" width="540" height="1212" fetchpriority="high"></figure>
</section>

<section class="film wrap section" aria-labelledby="film-heading"><h2 id="film-heading">${video.title}</h2><video controls playsinline preload="none" poster="${assets}video-poster-${lang}.jpg" width="1280" height="720" aria-label="${video.title}"><source src="${assets}avido-launch-${lang}.mp4" type="video/mp4"><track kind="captions" src="${assets}avido-launch-${lang}.vtt" srclang="${lang}" label="${lang === 'es' ? 'Español' : 'English'}" default><a href="${assets}avido-launch-${lang}.mp4">${video.fallback}</a></video><div class="film-notes"><details><summary>${video.transcript}</summary><p>${video.text}</p></details><a href="${assets}video-credits.txt">${video.credits}</a></div></section>
<section id="idea" class="manifesto section-dark"><div class="wrap manifesto-grid"><h2>${c.manifesto}</h2><div class="manifesto-body"><p>${c.body}</p><p>${c.body2}</p><a href="${repo}/blob/main/docs/habit-loop.md" class="text-link">${lang === 'es' ? 'El diseño del hábito, explicado' : 'The habit design, explained'} ${arrow}</a></div></div>
<div class="wrap loop-area"><div><h3>${c.switchTitle}</h3><div class="mode-switch" role="group" aria-label="${c.compare}">${c.modes.map((m,i)=>`<button type="button" data-mode="${i}" aria-pressed="${i === 1}">${m}</button>`).join('')}</div></div><div class="loop" aria-live="polite">${c.loopLabels.map((label,i)=>`<div><span>${label}</span><p data-loop="${i}">${c.loops[1][i]}</p></div>`).join('')}</div><p class="loop-note">${c.loopNote}</p></div></section>
<section id="reader" class="features wrap section"><div><h2>${c.featuresTitle}</h2><p class="format-line">EPUB / PDF / TXT / MD</p></div><dl>${c.features.map(([h,p])=>`<div><dt>${h}</dt><dd>${p}</dd></div>`).join('')}</dl></section>
<section class="gallery section"><div class="wrap gallery-layout"><div class="gallery-heading"><h2>${c.galleryTitle}</h2></div><div class="screenshots">${['app-home.webp','app-reader.webp'].map((img,i)=>`<figure><img src="${assets}${img}" alt="${c.gallery[i]}" width="540" height="1212" loading="lazy"><figcaption>${c.gallery[i]}</figcaption></figure>`).join('')}</div></div></section>
<section id="privacy" class="privacy section"><div class="wrap privacy-layout"><div><h2>${c.privacyTitle}</h2><p class="privacy-intro">${c.privacyIntro}</p></div><div><dl>${c.privacy.map(([h,p])=>`<div><dt>${h}</dt><dd>${p}</dd></div>`).join('')}</dl><p class="privacy-fine">${c.privacyFine}</p><a class="text-link" href="${repo}/blob/main/docs/privacy.md">${c.privacyLink} ${arrow}</a></div></div></section>
<section id="install" class="install wrap section"><div class="install-heading"><h2>${c.installTitle}</h2><p>${c.installIntro}</p>${button}<a class="text-link release-link" href="${repo}/releases/latest">${c.releaseLink} ${arrow}</a></div><ol class="install-steps">${c.steps.map(([h,p])=>`<li><h3>${h}</h3><p>${p}</p></li>`).join('')}</ol></section>
<section class="faq wrap section"><h2>${c.faqTitle}</h2><div>${c.faqs.map(([q,a])=>`<details><summary>${q}<span aria-hidden="true">+</span></summary><p>${a}</p></details>`).join('')}</div></section>
<section class="closing section-dark"><div class="wrap"><h2>${c.closing}</h2>${button}</div></section>
</main>
<footer class="wrap"><a class="brand" href="${prefix}${lang}/"><img src="${assets}icon.png" width="32" height="32" alt="">ávido</a><div><a href="${repo}">GitHub</a><a href="${repo}/blob/main/CONTRIBUTING.md">${c.contribute}</a><a href="${repo}/blob/main/LICENSE">${c.license}</a></div></footer>
<script type="application/json" id="loop-copy">${JSON.stringify(c.loops)}</script>
</body>
</html>\n`;
}
for (const lang of ['es','en']) {
  fs.mkdirSync(path.join(root,lang), {recursive:true});
  fs.writeFileSync(path.join(root,lang,'index.html'),render(lang));
}
fs.writeFileSync(path.join(root,'index.html'),render('en',true));
fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}sitemap.xml\n`);
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${['','es/','en/'].map(route=>`  <url><loc>${origin}${route}</loc>${['es','en'].map(lang=>`<xhtml:link rel="alternate" hreflang="${lang}" href="${origin}${lang}/"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${origin}"/></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(root,'.nojekyll'),'');
console.log('Built static English and Spanish launch pages.');
