const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const crypto = {
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: async (algorithm, value) => {
    assert.equal(algorithm, 'SHA-256');
    return createHash('sha256').update(value).digest('hex');
  },
};
const plain = (value) => JSON.parse(JSON.stringify(value));
function load(file, imports) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: (id) => {
    assert.ok(id in imports, `Unexpected import: ${id}`);
    return imports[id];
  }, console, Date, setTimeout });
  return exports;
}
const api = load('src/lib/progress-backup.ts', { 'expo-crypto': crypto });
const day = { sec: 300, pages: 5, xp: 60, sessions: 1, longest: 300, newBooks: 1, chapters: 0, quests: ['min5'], hours: { 12: 300 } };
function fixture() {
  return {
    exportedAt: 1792238400000,
    books: [{ id: 'legacy1', fileName: 'Reading.txt', size: 500, format: 'txt', title: 'Reading', addedAt: 10, firstOpenedAt: 20,
      progress: 0.4, maxProgress: 0.7, readSeconds: 300, readPages: 5, location: { chapter: 0, block: 2 } }],
    game: { xp: 60, freezes: 1, bestStreak: 0, goalsMet: 0, questsDone: 1, totalSec: 300, totalPages: 5, longestSession: 300,
      days: { '2026-10-17': { ...day } }, unlocked: { first_page: 20 }, finished: [], flags: {}, lastReconciled: '2026-10-17' },
    profile: { name: 'QA Reader', dailyGoalMin: 20, yearlyGoal: 24 },
  };
}

test('portable progress roundtrip includes real SHA-256 and excludes paths/actions', async () => {
  const data = fixture();
  Object.assign(data.books[0], { uri: 'content://private/book', coverUri: 'file:///private/cover', error: 'local error' });
  Object.assign(data.game, { queue: ['toast'], hold: true, evaluate: () => {} });
  Object.assign(data.profile, { reminders: true, onboarded: true });
  const raw = await api.encodeProgressBackup(data);
  const encoded = JSON.parse(raw);
  assert.equal(encoded.sha256, createHash('sha256').update(encoded.payload).digest('hex'));
  assert.equal(encoded.version, 1);
  assert.doesNotMatch(raw, /content:\/\/|file:\/\/|evaluate|queue|hold|reminders|onboarded/);
  assert.deepEqual(plain(await api.decodeProgressBackup(raw)), fixture());
});

test('corruption, future versions, foreign files and oversized backups are rejected', async () => {
  const encoded = JSON.parse(await api.encodeProgressBackup(fixture()));
  await assert.rejects(api.decodeProgressBackup(JSON.stringify({ ...encoded, payload: encoded.payload.replace('QA Reader', 'Someone') })), /checksum/);
  await assert.rejects(api.decodeProgressBackup(JSON.stringify({ ...encoded, version: 2 })), /Unsupported/);
  await assert.rejects(api.decodeProgressBackup('{}'), /Unsupported/);
  await assert.rejects(api.decodeProgressBackup('bad JSON'));
  await assert.rejects(api.decodeProgressBackup('x'.repeat(10 * 1024 * 1024 + 1)), /large/);
});

for (const [label, mutate] of [
  ['negative reading time', (d) => { d.books[0].readSeconds = -1; }],
  ['nonfinite totals', (d) => { d.game.totalSec = Infinity; }],
  ['invalid progress', (d) => { d.books[0].progress = 1.5; }],
  ['path traversal IDs', (d) => { d.books[0].id = '../secret'; }],
  ['invalid locations', (d) => { d.books[0].location.block = 0.5; }],
  ['invalid flags', (d) => { d.game.flags.nightOwl = 'yes'; }],
  ['invalid hours', (d) => { d.game.days['2026-10-17'].hours = { 24: 60 }; }],
  ['invalid dates', (d) => { d.game.days['2026-02-30'] = day; }],
  ['duplicate IDs', (d) => { d.books.push({ ...d.books[0] }); }],
  ['missing day fields', (d) => { delete d.game.days['2026-10-17'].quests; }],
  ['invalid goals', (d) => { d.profile.dailyGoalMin = 0; }],
]) test(`reject ${label} before restoring anything`, () => {
  const d = fixture(); mutate(d); assert.throws(() => api.validateProgressBackup(d));
});

test('restore preserves local IDs, paths and metadata while remapping progress', () => {
  const saved = fixture().books;
  const local = { current: { ...saved[0], id: 'current', uri: 'content://new/Reading.txt', coverUri: 'file:///cover', metaLoaded: true, hue: 80, progress: 0 } };
  const restored = api.restoreBooks(local, saved);
  assert.equal(restored.idMap.get('legacy1'), 'current');
  assert.equal(restored.books.current.uri, local.current.uri);
  assert.equal(restored.books.current.coverUri, local.current.coverUri);
  assert.equal(restored.books.current.progress, 0.4);
  assert.equal(restored.books.current.location.block, 2);
  assert.equal(local.current.progress, 0);
});

test('missing books become portable placeholders and collisions do not overwrite files', () => {
  const saved = fixture().books;
  const restored = api.restoreBooks({ legacy1: { ...saved[0], fileName: 'Different.txt', uri: 'content://other' } }, saved);
  assert.equal(restored.books.legacy1.uri, 'content://other');
  assert.equal(restored.books['legacy1~'].missing, true);
  assert.equal(restored.books['legacy1~'].uri, '');
  assert.equal(restored.books['legacy1~'].progress, 0.4);
});

test('ambiguous filenames and sizes never transfer progress to an arbitrary local book', () => {
  const saved = fixture().books;
  const local = Object.fromEntries(['one', 'two'].map((id) => [id, { ...saved[0], id, uri: `content://${id}` }]));
  const restored = api.restoreBooks(local, saved);
  assert.equal(restored.books.one.progress, 0);
  assert.equal(restored.books.two.progress, 0);
  assert.equal(restored.books.legacy1.missing, true);
});

function transferSetup({ writeFails = false, canceled = false, raw } = {}) {
  const d = fixture();
  const store = (initial) => {
    let state = initial;
    return { getState: () => state, setState: (patch) => { state = { ...state, ...patch }; } };
  };
  const library = store({ books: { current: { ...d.books[0], id: 'current', uri: 'content://current', metaLoaded: true, hue: 80, progress: 0 } }, folderUri: 'content://folder' });
  const game = store({ ...d.game, xp: 0, queue: ['old'], hold: true });
  const settings = store({ ...d.profile, mode: 'light', onboarded: true });
  const writes = [];
  const file = { size: 500, exists: true, text: async () => raw, delete() { this.exists = false; } };
  const transfer = load('src/lib/progress-transfer.ts', {
    '@react-native-async-storage/async-storage': { multiSet: async (entries) => { if (writeFails) throw Error('disk full'); writes.push(entries); } },
    'expo-document-picker': { getDocumentAsync: async () => canceled ? { canceled: true } : { canceled: false, assets: [{ uri: 'file:///cache/copy' }] } },
    'expo-file-system': { File: function () { return file; }, Paths: {} }, 'expo-sharing': {},
    '@/store/game': { useGame: game }, '@/store/library': { useLibrary: library }, '@/store/settings': { useSettings: settings },
    './library': { waitForLibraryScan: async () => {} }, './progress-backup': api,
  });
  return { transfer, library, game, settings, writes, file };
}

test('import persists all state, maps finished IDs and keeps current device settings', async () => {
  const d = fixture(); d.game.finished = [{ id: 'legacy1', title: 'Reading', at: 40, days: 1 }];
  const app = transferSetup();
  await app.transfer.importProgress(d);
  assert.equal(app.writes[0].length, 3);
  assert.equal(app.library.getState().books.current.progress, 0.4);
  assert.equal(app.library.getState().folderUri, 'content://folder');
  assert.equal(app.game.getState().finished[0].id, 'current');
  assert.equal(app.game.getState().queue.length, 0);
  assert.equal(app.settings.getState().mode, 'light');
  assert.equal(app.settings.getState().onboarded, true);
});

test('storage failure leaves visible state unchanged and does not report success', async () => {
  const app = transferSetup({ writeFails: true });
  await assert.rejects(app.transfer.importProgress(fixture()), /disk full/);
  assert.equal(app.game.getState().xp, 0);
  assert.equal(app.library.getState().books.current.progress, 0);
});

test('canceling or rejecting a picked file changes no progress and cleans cached copies', async () => {
  const canceled = transferSetup({ canceled: true });
  assert.equal(await canceled.transfer.pickProgressBackup(), null);
  assert.equal(canceled.writes.length, 0);
  const bad = transferSetup({ raw: '{}' });
  await assert.rejects(bad.transfer.pickProgressBackup());
  assert.equal(bad.file.exists, false);
  assert.equal(bad.writes.length, 0);
});

const hash = load('src/lib/hash.ts', {});
function scannerSetup({ books = {}, files = [], folderUri = 'content://folder', failRoot = false, onDigest } = {}) {
  class File {
    constructor(uri, name = 'Reading.txt', size = 500) { this.uri = uri; this.name = name; this.size = size; }
  }
  const entries = files.map((f) => new File(f.uri, f.name, f.size));
  class Directory {
    constructor(uri) { this.uri = uri; }
    list() { if (failRoot) throw Error('access denied'); return entries; }
  }
  const state = { books, folderUri, replaceBooks: (next) => { state.books = next; }, updateBook: (id, patch) => Object.assign(state.books[id], patch) };
  const scan = { scanning: false, set: (patch) => Object.assign(scan, patch) };
  const api = load('src/lib/library.ts', {
    'expo-file-system': { File, Directory },
    'expo-crypto': { ...crypto, digestStringAsync: async (...args) => { await onDigest?.(state); return crypto.digestStringAsync(...args); } },
    'react-native': { Alert: { alert() {} } }, '@/store/library': { useLibrary: { getState: () => state }, useScan: { getState: () => scan } },
    './epub': {}, './paths': {}, './hash': hash, '@/i18n': { tx: (_es, en) => en },
  });
  return { api, state, scan };
}
const localBook = (patch = {}) => ({ ...fixture().books[0], uri: 'content://folder/Reading.txt', hue: 0, metaLoaded: true, ...patch });

test('new books get 64-character SHA-256 IDs and stable IDs across scans', async () => {
  const app = scannerSetup({ files: [{ uri: 'content://folder/Reading.txt' }] });
  await app.api.scanLibrary();
  const id = createHash('sha256').update('Reading.txt:500').digest('hex');
  assert.equal(app.state.books[id].title, 'Reading');
  await app.api.scanLibrary();
  assert.deepEqual(Object.keys(app.state.books), [id]);
});

test('legacy IDs, progress and location survive same-URI scans and folder moves', async () => {
  const id = hash.hashString('Reading.txt:500');
  for (const uri of ['content://folder/Reading.txt', 'content://new-folder/Reading.txt']) {
    const app = scannerSetup({ books: { [id]: localBook({ id }) }, files: [{ uri }] });
    await app.api.scanLibrary();
    assert.equal(app.state.books[id].uri, uri);
    assert.equal(app.state.books[id].progress, 0.4);
    assert.equal(app.state.books[id].location.block, 2);
  }
});

test('same-name same-size files remain separate and keep separate progress', async () => {
  const app = scannerSetup({ files: [{ uri: 'content://folder/one/Reading.txt' }, { uri: 'content://folder/two/Reading.txt' }] });
  await app.api.scanLibrary();
  const ids = Object.keys(app.state.books);
  assert.equal(ids.length, 2);
  app.state.books[ids[0]].progress = 0.3;
  app.state.books[ids[1]].progress = 0.8;
  await app.api.scanLibrary();
  assert.equal(app.state.books[ids[0]].progress, 0.3);
  assert.equal(app.state.books[ids[1]].progress, 0.8);
});

test('restored placeholders reattach to selected files and retain progress', async () => {
  const app = scannerSetup({ books: { legacy1: localBook({ uri: '', missing: true, metaLoaded: true }) }, files: [{ uri: 'content://new/Reading.txt' }] });
  await app.api.scanLibrary();
  assert.equal(app.state.books.legacy1.uri, 'content://new/Reading.txt');
  assert.equal(app.state.books.legacy1.progress, 0.4);
  assert.equal(app.state.books.legacy1.missing, false);
});

test('revoked root access keeps existing books and resets scanning state', async () => {
  const books = { legacy1: localBook() };
  const app = scannerSetup({ books, failRoot: true });
  await assert.rejects(app.api.scanLibrary(), /accessible/);
  assert.equal(app.state.books, books);
  assert.equal(app.scan.scanning, false);
});

test('asynchronous hashes do not overwrite progress saved by an active reader', async () => {
  const app = scannerSetup({ books: { legacy1: localBook() }, files: [{ uri: 'content://folder/Reading.txt' }],
    onDigest: (state) => { state.books = { legacy1: { ...state.books.legacy1, progress: 0.9, readSeconds: 900 } }; } });
  await app.api.scanLibrary();
  assert.equal(app.state.books.legacy1.progress, 0.9);
  assert.equal(app.state.books.legacy1.readSeconds, 900);
});

test('export writes a validated backup only into the folder selected by the user', async () => {
  const app = transferSetup();
  const d = fixture();
  let written;
  const transfer = load('src/lib/progress-transfer.ts', {
    '@react-native-async-storage/async-storage': {}, 'expo-document-picker': {},
    'expo-file-system': { Directory: { pickDirectoryAsync: async () => ({ createFile: (name, mime) => {
      assert.match(name, /^avido-progress-.*\.json$/); assert.equal(mime, 'application/json');
      return { write: (raw) => { written = raw; }, exists: true, delete() {} };
    } }) } },
    '@/store/game': { useGame: app.game }, '@/store/library': { useLibrary: app.library }, '@/store/settings': { useSettings: app.settings },
    './library': { waitForLibraryScan: async () => {} }, './progress-backup': api,
  });
  assert.equal(await transfer.exportProgress(), true);
  const restored = await api.decodeProgressBackup(written);
  assert.equal(restored.profile.name, d.profile.name);
  assert.equal(restored.books[0].id, 'current');
});

test('legacy hash collisions cannot transfer another book’s progress', async () => {
  const id = hash.hashString('Reading.txt:500');
  const app = scannerSetup({ books: { [id]: localBook({ id, uri: 'content://gone', fileName: 'Another.txt', progress: 0.9 }) }, files: [{ uri: 'content://new/Reading.txt' }] });
  await app.api.scanLibrary();
  const newId = createHash('sha256').update('Reading.txt:500').digest('hex');
  assert.equal(app.state.books[newId].progress, 0);
  assert.equal(app.state.books[id].missing, true);
  assert.equal(app.state.books[id].progress, 0.9);
});

test('an asynchronous scan cannot resurrect a book deleted while hashing', async () => {
  const app = scannerSetup({ books: { legacy1: localBook() }, files: [{ uri: 'content://folder/Reading.txt' }], onDigest: (state) => { state.books = {}; } });
  await app.api.scanLibrary();
  assert.equal(Object.keys(app.state.books).length, 0);
});
