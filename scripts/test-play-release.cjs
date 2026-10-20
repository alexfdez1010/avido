const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function config(env) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(root, 'app.config.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, process: { env } });
  return exports.default({ config: {} });
}

test('Play, legacy APK and QA retain separate Android identities', () => {
  assert.equal(config({}).android.package, 'com.alexfdez.avido');
  assert.equal(config({ AVIDO_STORE: 'play' }).android.package, 'com.alexfdez.avido.play');
  assert.equal(config({ AVIDO_LOCAL_QA: '1' }).android.package, 'com.alexfdez.avido.local');
  assert.throws(() => config({ AVIDO_LOCAL_QA: '1', AVIDO_STORE: 'play' }), /must be separate/);
  assert.equal(config({ AVIDO_STORE: 'play' }).extra.distribution, 'play');
  assert.equal(config({}).extra.distribution, 'direct');
  assert.ok(config({ AVIDO_STORE: 'play' }).android.blockedPermissions.includes('android.permission.INTERNET'));
  assert.ok(!config({}).android.blockedPermissions.includes('android.permission.INTERNET'));
});

test('catalogue access is enabled only for explicit direct-download builds', () => {
  for (const edition of ['play', 'direct', 'unknown', undefined]) {
    const exports = {};
    vm.runInNewContext(ts.transpileModule(readFileSync(path.join(root, 'src/lib/distribution.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText, { exports, require: () => ({ expoConfig: { extra: { distribution: edition } } }) });
    assert.equal(exports.DISCOVER_ENABLED, edition === 'direct');
  }
});

test('Play catalogue and download guards reject before network or filesystem access', async () => {
  const exports = {};
  const touched = () => { throw new Error('Unexpected I/O'); };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(root, 'src/lib/gutenberg.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, fetch: touched, require: id => id === './distribution' ? { DISCOVER_ENABLED: false } : new Proxy({}, { get: () => touched }) });
  await assert.rejects(exports.fetchCatalog('https://www.gutenberg.org'), /unavailable in this edition/);
  await assert.rejects(exports.downloadFreeBook({ id: 1 }), /unavailable in this edition/);
});

test('Play rejects the debug signing fallback while legacy releases retain it', () => {
  let gradle = `android { signingConfigs { debug { storeFile file('debug.keystore') } } buildTypes { release { signingConfig signingConfigs.debug } } }`;
  const context = { module: { exports: {} }, require: () => ({ withAppBuildGradle: (cfg, transform) => {
    const result = transform({ modResults: { contents: gradle } });
    gradle = result.modResults.contents;
    return cfg;
  } }) };
  vm.runInNewContext(readFileSync(path.join(root, 'plugins/with-release-signing.js'), 'utf8'), context);
  context.module.exports({});
  assert.match(gradle, /System.getenv\('AVIDO_STORE'\) == 'play'[\s\S]*throw new GradleException/);
  assert.match(gradle, /signingConfig signingConfigs.release/);
  assert.match(gradle, /else \{\s*storeFile file\('debug.keystore'\)/);
});

test('public privacy policies have direct contact, data retention and deletion details', () => {
  for (const language of ['es', 'en']) {
    const html = readFileSync(path.join(root, `site/${language}/privacy/index.html`), 'utf8');
    assert.match(html, /mailto:apps_alejandro@proton.me/);
    assert.match(html, /Alejandro Fernández Camello/);
    assert.match(html, /60/);
    assert.match(html, /Project Gutenberg/);
    assert.match(html, language === 'es' ? /Conservación y eliminación/ : /Retention and deletion/);
    assert.doesNotMatch(html, /<script/);
  }
});
