const assert = require('node:assert/strict');
const { existsSync, readFileSync, readdirSync, statSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const siteRoot = path.resolve(__dirname, '../site');
const production = new URL('https://avido.alejandrofernandezcamello.me/');
const languages = ['es', 'en'];
const read = (file) => readFileSync(path.join(siteRoot, file), 'utf8');

function attributes(source) {
  return Object.fromEntries([...source.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map((match) => [match[1].toLowerCase(), match[2] ?? match[3]]));
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))]
    .map((match) => attributes(match[1]));
}

function meta(html, name) {
  return tags(html, 'meta').find((tag) => tag.name === name || tag.property === name)?.content;
}

function localFile(url) {
  assert.ok(url.pathname.startsWith(production.pathname), `URL escapes project base: ${url}`);
  const relative = decodeURIComponent(url.pathname.slice(production.pathname.length));
  let file = path.resolve(siteRoot, relative);
  assert.ok(file === siteRoot || file.startsWith(`${siteRoot}${path.sep}`), `URL escapes site: ${url}`);
  assert.ok(existsSync(file), `Missing local target: ${url}`);
  if (statSync(file).isDirectory()) file = path.join(file, 'index.html');
  assert.ok(existsSync(file), `Missing index page: ${url}`);
  return file;
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

for (const language of languages) {
  test(`${language} is a complete indexable localized page`, () => {
    const html = read(`${language}/index.html`);
    assert.match(html, /<!doctype html>/i);
    assert.equal(tags(html, 'html')[0]?.lang, language);
    assert.ok(tags(html, 'meta').some((tag) => tag.charset?.toLowerCase() === 'utf-8'));
    assert.ok(meta(html, 'viewport')?.includes('width=device-width'));
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
    assert.ok(title?.trim(), 'A meaningful title must be in the initial HTML');
    assert.ok(meta(html, 'description')?.trim(), 'Description must be in the initial HTML');
    assert.doesNotMatch(meta(html, 'robots') || '', /noindex/i);
    assert.equal(tags(html, 'h1').length, 1, 'Use a single main heading');
    assert.equal(tags(html, 'link').find((tag) => tag.rel === 'canonical')?.href,
      new URL(`${language}/`, production).href);

    const alternates = tags(html, 'link').filter((tag) => tag.rel === 'alternate');
    for (const alternate of languages) {
      assert.equal(alternates.find((tag) => tag.hreflang === alternate)?.href,
        new URL(`${alternate}/`, production).href);
    }
    assert.equal(alternates.find((tag) => tag.hreflang === 'x-default')?.href, production.href);
    const other = language === 'es' ? 'en' : 'es';
    assert.ok(tags(html, 'a').some((tag) => tag.href &&
      new URL(tag.href, new URL(`${language}/`, production)).href === new URL(`${other}/`, production).href),
    'The other language must be available through an ordinary link');

    const structuredData = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
      .filter((match) => attributes(match[1]).type === 'application/ld+json');
    assert.ok(structuredData.length, 'Include structured data in the HTML');
    for (const match of structuredData) {
      const data = JSON.parse(match[2]);
      assert.ok(data['@context'] || Array.isArray(data), 'JSON-LD must provide a context');
    }
  });

  test(`${language} sharing metadata points to a real 1200 × 630 PNG`, () => {
    const html = read(`${language}/index.html`);
    const url = new URL(`${language}/`, production);
    assert.equal(meta(html, 'og:type'), 'website');
    assert.equal(meta(html, 'og:url'), url.href);
    assert.ok(meta(html, 'og:title')?.trim());
    assert.ok(meta(html, 'og:description')?.trim());
    assert.ok(meta(html, 'og:locale')?.startsWith(language));
    assert.ok(meta(html, 'og:image:alt')?.trim());
    assert.equal(meta(html, 'og:image:width'), '1200');
    assert.equal(meta(html, 'og:image:height'), '630');
    assert.equal(meta(html, 'twitter:card'), 'summary_large_image');
    const image = meta(html, 'og:image');
    assert.ok(image?.startsWith(production.href), 'Social image must have an absolute production URL');
    assert.equal(meta(html, 'twitter:image'), image);
    const png = readFileSync(localFile(new URL(image)));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
  });
}

test('all local HTML links, fragments, and assets resolve under the deployed base', () => {
  for (const file of walk(siteRoot).filter((entry) => entry.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    const relative = path.relative(siteRoot, file).split(path.sep).join('/');
    const pageURL = new URL(relative.replace(/index\.html$/, ''), production);
    for (const tag of tags(html, '[a-z][\\w:-]*')) {
      for (const attribute of ['href', 'src', 'poster']) {
        const value = tag[attribute];
        if (!value || /^(?:mailto:|tel:|data:)/i.test(value)) continue;
        assert.doesNotMatch(value, /^javascript:/i, 'Do not use JavaScript pseudo-links');
        const url = new URL(value.replace(/&amp;/g, '&'), pageURL);
        if (url.origin !== production.origin) continue;
        const target = localFile(url);
        if (url.hash && target.endsWith('.html')) {
          const id = decodeURIComponent(url.hash.slice(1));
          assert.ok(tags(readFileSync(target, 'utf8'), '[a-z][\\w:-]*').some((entry) => entry.id === id),
            `Missing fragment ${url} linked from ${relative}`);
        }
      }
    }
    for (const image of tags(html, 'img')) assert.ok('alt' in image, `Missing alt attribute in ${relative}`);
  }
});

test('self-hosted CSS images and fonts resolve', () => {
  for (const file of walk(siteRoot).filter((entry) => entry.endsWith('.css'))) {
    const relative = path.relative(siteRoot, file).split(path.sep).join('/');
    const stylesheetURL = new URL(relative, production);
    for (const match of readFileSync(file, 'utf8').matchAll(/url\(\s*(['"]?)([^'"\s)]+)\1\s*\)/g)) {
      if (match[2].startsWith('data:')) continue;
      const url = new URL(match[2], stylesheetURL);
      if (url.origin === production.origin) localFile(url);
    }
  }
});

test('sitemap and crawler instructions expose both stable language routes', () => {
  const robots = read('robots.txt');
  assert.match(robots, /User-agent:\s*\*/i);
  assert.ok(robots.includes(`Sitemap: ${new URL('sitemap.xml', production).href}`));
  assert.doesNotMatch(robots, /^Disallow:\s*\/\s*$/mi);
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<urlset\b[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  for (const language of languages) {
    assert.ok(sitemap.includes(`<loc>${new URL(`${language}/`, production).href}</loc>`));
  }
  for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) localFile(new URL(match[1]));
  const root = read('index.html');
  for (const language of languages) {
    assert.ok(tags(root, 'a').some((tag) => tag.href &&
      new URL(tag.href, production).href === new URL(`${language}/`, production).href),
    'The root must offer both languages without JavaScript');
  }
});

test('neutral entry selects Spanish or English and preserves shared location', () => {
  const vm = require('node:vm');
  const script = read('assets/language.js');
  for (const [preferred, expected] of [
    ['es-ES', 'es'], ['es-MX', 'es'], ['en-US', 'en'], ['fr-FR', 'en'], ['', 'en'],
    [['ca-ES', 'es-ES', 'en-GB'], 'es'], [['fr-FR', 'en-GB', 'es-ES'], 'en'],
  ]) {
    let redirected;
    const location = {
      href: `${production.href}?from=readme#install`,
      hash: '#install',
      search: '?from=readme',
      replace: (url) => { redirected = url; },
    };
    vm.runInNewContext(script, {
      URL,
      navigator: { languages: Array.isArray(preferred) ? preferred : preferred ? [preferred] : [], language: Array.isArray(preferred) ? preferred[0] : preferred },
      window: { location },
    });
    assert.equal(redirected, `${production.href}${expected}/?from=readme#install`);
  }
  for (const language of languages) {
    assert.doesNotMatch(read(`${language}/index.html`), /<script[^>]+src=["'][^"']*language\.js/,
      'Explicit language URLs must stay in the selected language');
  }
});

test('marketing headings have no full stops', () => {
  for (const language of languages) {
    const html = read(`${language}/index.html`);
    for (const heading of html.matchAll(/<(h[1-3]|dt)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
      assert.doesNotMatch(heading[2].replace(/<[^>]*>/g, ''), /\./, 'Keep full stops out of headings');
    }
  }
});

test('localized films give visitors control without extra subtitle overlays', () => {
  for (const language of languages) {
    const html = read(`${language}/index.html`);
    const player = tags(html, 'video')[0];
    assert.ok(player, 'Include the launch film player');
    assert.equal(player.preload, 'none', 'Do not download the film before it is requested');
    assert.ok(!('autoplay' in player), 'Visitors control film playback');
    assert.ok(player['aria-label']);
    assert.ok(html.match(/<video\b[^>]*\bcontrols\b/));
    assert.ok(new URL(player.poster, production).pathname.endsWith(`video-poster-${language}.jpg`));
    assert.equal(tags(html, 'track').length, 0, 'The owner requested no subtitle overlays');
    assert.ok(html.includes('PT33S'), 'Keep the video metadata aligned with the final edit');
    assert.doesNotMatch(html, /Ver el contenido del vídeo|Read the video transcript/);
    const video = readFileSync(path.join(siteRoot, 'assets', `avido-launch-${language}.mp4`));
    assert.equal(video.subarray(4, 8).toString(), 'ftyp');
    assert.ok(video.length < 10 * 1024 * 1024, 'Keep the short film below 10 MiB');
    assert.ok(html.includes('video-credits.txt'), 'Preserve the linked music attribution');
  }
});


test('each website language uses its own native app screenshots', () => {
  for (const language of languages) {
    const html = read(`${language}/index.html`);
    for (const screen of ['home', 'library', 'stats', 'trophies', 'reader', 'stats-details', 'trophies-details']) {
      const relative = `assets/screenshots/${language}/${screen}.webp`;
      const image = readFileSync(path.join(siteRoot, relative));
      assert.equal(image.subarray(0, 4).toString(), 'RIFF');
      assert.equal(image.subarray(8, 12).toString(), 'WEBP');
      assert.ok(html.includes(`screenshots/${language}/${screen}.webp`));
      const other = language === 'es' ? 'en' : 'es';
      assert.notDeepEqual(image, readFileSync(path.join(siteRoot, 'assets', 'screenshots', other, `${screen}.webp`)),
        `${screen} must be a separate capture for each app language`);
    }
  }
});

test('the film and accessible screenshot carousel share the product showcase', () => {
  for (const language of languages) {
    const html = read(`${language}/index.html`);
    const showcase = html.match(/<section id="inside"[^>]*>[\s\S]*?<\/section>/)?.[0];
    assert.ok(showcase, 'Keep product evidence in one section');
    assert.equal(tags(showcase, 'video').length, 1);
    assert.equal(tags(showcase, 'figure').length, 6);
    assert.ok(tags(showcase, 'div').some((tag) => 'data-carousel-track' in tag || tag.id === 'screenshots'));
    const controls = tags(showcase, 'button');
    assert.equal(controls.length, 2);
    assert.ok(controls.every((tag) => tag['aria-controls'] === 'screenshots' && tag['aria-label']));
    assert.equal(tags(showcase, 'p').find((tag) => tag['aria-live'] === 'polite')?.['aria-atomic'], 'true');
    assert.ok(showcase.includes('id="film-heading"'), 'Keep existing shared film links working');
    for (const heading of html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)) {
      assert.doesNotMatch(heading[1], /33/, 'Do not show a separate film-duration heading');
    }
  }
});
