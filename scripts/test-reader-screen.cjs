const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise screen callbacks and rendered props without starting a native runtime.
async function setup({ pure = true, layout = 'scroll', format = 'txt', seconds = 0, loadError = false, targetMin = '5' } = {}) {
  let cursor = 0;
  let backs = 0;
  let flushes = 0;
  let backHandler;
  const hooks = [];
  const effects = [];
  const timeouts = new Map();
  const enabledStates = [];
  let timerId = 0;
  let book = { id: 'novel', title: 'A book', format, progress: 0, maxProgress: 0, readSeconds: 0 };
  const prefs = { theme: 'night', font: 'literata', size: 19, lineHeight: 1.62, margin: 24, layout, footer: { left: pure ? 'none' : 'percent', right: 'none', bar: !pure } };
  const content = { totalChars: 3000, chapters: [{ title: 'First chapter', chars: 3000, blocks: [{ k: 'p', c: 1500, s: [{ t: 'First words' }] }, { k: 'p', c: 1500, s: [{ t: 'Last words' }] }] }] };
  const same = (a, b) => a && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useRef(value) { const i = cursor++; return hooks[i] ??= { current: value }; },
    useState(value) { const i = cursor++; hooks[i] ??= { value }; return [hooks[i].value, (next) => { hooks[i].value = typeof next === 'function' ? next(hooks[i].value) : next; }]; },
    useMemo(callback, deps) { const i = cursor++; if (!same(hooks[i]?.deps, deps)) hooks[i] = { deps, value: callback() }; return hooks[i].value; },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(effect, deps) { const i = cursor++; if (!same(hooks[i]?.deps, deps)) effects.push(() => { hooks[i]?.cleanup?.(); hooks[i] = { deps, cleanup: effect() }; }); },
    useLayoutEffect(effect, deps) { react.useEffect(effect, deps); },
  };
  const tracker = { isForeground: true, elapsedSec: seconds, sessionSec: 0, idle: false, poke() {}, addPages() {}, flush() { flushes++; } };
  const library = { updateBook: (_id, patch) => { book = { ...book, ...patch }; } };
  const game = { days: {}, setHold() {}, startSession() {}, evaluate() {}, chapterDone() {}, finishBook() {} };
  const gesture = () => {
    const result = {};
    for (const method of ['maxDuration', 'maxDistance', 'runOnJS']) result[method] = () => result;
    result.onEnd = (callback) => { result.tap = callback; return result; };
    return result;
  };
  const jsx = (type, props) => ({ type, props });
  const imports = {
    react: { ...react, default: react },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    '@shopify/flash-list': { FlashList: 'FlashList' },
    'expo-keep-awake': { useKeepAwake() {} },
    'expo-navigation-bar': { NavigationBar: 'NavigationBar' },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    'expo-router': { router: { back: () => backs++ }, useLocalSearchParams: () => ({ id: 'novel', targetMin }) },
    'lucide-react-native': { ArrowLeft: 'ArrowLeft', ListTree: 'ListTree', Type: 'Type' },
    'react-native': { View: 'View', ActivityIndicator: 'ActivityIndicator', AppState: { addEventListener: () => ({ remove() {} }) }, BackHandler: { addEventListener: (_event, callback) => { backHandler = callback; return { remove() {} }; } } },
    'react-native-gesture-handler': { Gesture: { Tap: gesture }, GestureDetector: 'GestureDetector' },
    'react-native-reanimated': { default: { View: 'AnimatedView' }, FadeIn: { duration() {} }, FadeOut: { duration() {} } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 32, bottom: 24 }) },
    '@/components/kit': Object.fromEntries(['Bar', 'Cta', 'Flame', 'Ring', 'Tap', 'Txt'].map((name) => [name, name])),
    '@/components/reader/block-view': { BlockView: 'BlockView' },
    '@/components/reader/paged-view': { PagedView: 'PagedView' },
    '@/components/reader/reader-footer': { ReaderFooter: 'ReaderFooter', footerHeight: () => pure ? 0 : 20, formatMinutes: String },
    '@/components/reader/live-toast': { LiveToast: 'LiveToast' },
    '@/components/reader/pdf-reader': { PdfReader: 'PdfReader' },
    '@/components/reader/settings-sheet': { ReaderSettingsSheet: 'ReaderSettingsSheet' },
    '@/components/reader/toc-sheet': { TocSheet: 'TocSheet' },
    '@/hooks/use-reading-tracker': { useReadingTracker: (_id, enabled) => { enabledStates.push(enabled); return tracker; } },
    '@/lib/content': { loadContent: () => loadError ? Promise.reject(new Error('Unreadable file')) : Promise.resolve(content) },
    '@/lib/dates': { dayKey: () => '2026-10-16', formatClock: String },
    '@/lib/stats': { personalCharsPerMin: () => 1000 },
    '@/lib/reading-plan': { parseSessionTarget: () => targetMin == null ? null : Number(targetMin) },
    '@/lib/types': { CHARS_PER_PAGE: 1500, FINISH_THRESHOLD: 0.8 },
    '@/store/game': { useGame: Object.assign((select) => select(game), { getState: () => game }) },
    '@/store/library': { useLibrary: (select) => select({ books: { novel: book }, ...library }) },
    '@/store/settings': { useSettings: (select) => select({ reader: prefs, eink: false }), footerEmpty: (footer) => footer.left === 'none' && footer.right === 'none' && !footer.bar },
    '@/theme/fonts': { readingFonts: { literata: {} } },
    '@/theme/palette': { readerThemes: { night: { bg: '#000', text: '#fff' } } },
    '@/i18n': { tx: (es) => es },
    '../../../modules/volume-keys': { captureVolumeKeys() {} },
  };
  const exports = {};
  const source = ts.transpileModule(readFileSync(path.join(__dirname, '../src/app/reader/[id].tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { exports,
    require: (id) => { assert.ok(id in imports, `Unexpected import: ${id}`); return imports[id]; },
    setTimeout: (callback) => { timeouts.set(++timerId, callback); return timerId; },
    clearTimeout: (id) => timeouts.delete(id), requestAnimationFrame: (callback) => callback(),
  });
  let tree;
  const render = () => { cursor = 0; tree = exports.default(); while (effects.length) effects.shift()(); return tree; };
  const all = (type) => {
    const found = [];
    const visit = (node) => { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) return node.forEach(visit); if (node.type === type) found.push(node); visit(node.props?.children); };
    visit(tree);
    return found;
  };
  const one = (type) => { const nodes = all(type); assert.equal(nodes.length, 1, `Expected one ${type}`); return nodes[0].props; };
  const byId = (id) => { const node = all('Tap').find((node) => node.props.testID === id); assert.ok(node, `Missing ${id}`); return node.props; };
  render();
  await Promise.resolve();
  await Promise.resolve();
  render();
  const reveal = () => { if (format === 'pdf') one('PdfReader').onTap(); else if (layout === 'paged') one('PagedView').onToggle(); else one('GestureDetector').gesture.tap({ x: 100 }); render(); };
  return { render, all, one, byId, reveal, tracker, enabledStates, book: () => book, backs: () => backs, back: () => backHandler(), flushes: () => flushes, pendingSaves: () => timeouts.size };
}

for (const layout of ['scroll', 'paged']) test(`pure ${layout} preserves book words and hides generated reader UI`, async () => {
  const app = await setup({ layout });
  assert.equal(app.all('ReaderFooter').length, 0);
  assert.equal(app.one('LiveToast').enabled, false);
  assert.equal(app.one('NavigationBar').hidden, true);
  const view = app.one(layout === 'scroll' ? 'FlashList' : 'PagedView');
  const items = layout === 'scroll' ? view.data : view.items;
  const draw = (item) => layout === 'scroll' ? view.renderItem({ item }) : view.renderItem(item);
  assert.equal(draw(items.find((item) => item.type === 'head')), null);
  assert.equal(draw(items.find((item) => item.type === 'foot')), null);
  assert.equal(draw(items.find((item) => item.type === 'block')).type, 'BlockView');
  if (layout === 'scroll') {
    assert.ok(view.contentContainerStyle.paddingTop >= 32);
    assert.ok(view.contentContainerStyle.paddingBottom >= 24);
  }
  app.reveal();
  assert.equal(app.one('NavigationBar').hidden, false);
  assert.equal(app.one('LiveToast').enabled, false);
});

test('closing before the position debounce saves the latest visible block', async () => {
  const app = await setup();
  const list = app.one('FlashList');
  const block = list.data.find((item) => item.type === 'block');
  list.onViewableItemsChanged({ viewableItems: [{ item: block }] });
  assert.equal(app.book().progress, 0);
  assert.equal(app.pendingSaves(), 1);
  app.reveal();
  app.byId('reader-close').onPress();
  assert.equal(app.backs(), 1);
  assert.equal(app.book().progress, 0.5);
  assert.equal(app.book().location.chapter, 0);
  assert.equal(app.book().location.block, 0);
  assert.equal(app.pendingSaves(), 0);
});

for (const seconds of [61, 300, 1801]) test(`leaving after ${seconds}s exits immediately without a recap or writing step`, async () => {
  const app = await setup({ seconds });
  app.reveal();
  app.byId('reader-close').onPress();
  app.render();
  assert.equal(app.backs(), 1);
  assert.equal(app.flushes(), 1);
  assert.equal(app.enabledStates.at(-1), true);
  assert.equal(app.all('SessionSheet').length, 0);
  assert.equal(app.all('TextInput').length, 0);
});

test('passing a chosen start does not stop or pause the reader', async () => {
  const app = await setup({ pure: false, seconds: 299 });
  assert.equal(app.one('LiveToast').targetMin, 5);
  assert.equal(app.one('LiveToast').sessionSec, 299);
  app.tracker.elapsedSec = 301;
  app.render();
  assert.equal(app.enabledStates.at(-1), true);
  assert.equal(app.one('LiveToast').sessionSec, 301);
  assert.equal(app.all('FlashList').length, 1);
  assert.equal(app.backs(), 0);
  assert.equal(app.all('SessionSheet').length, 0);
  assert.equal(app.all('TextInput').length, 0);
});

test('Android back saves and exits immediately after the chosen time', async () => {
  const app = await setup({ seconds: 301 });
  const list = app.one('FlashList');
  list.onViewableItemsChanged({ viewableItems: [{ item: list.data.find((item) => item.type === 'block') }] });
  assert.equal(app.back(), true);
  assert.equal(app.backs(), 1);
  assert.equal(app.flushes(), 1);
  assert.equal(app.book().progress, 0.5);
  assert.equal(app.pendingSaves(), 0);
});

test('pure PDF hides reader UI and starts accounting only after native load', async () => {
  const app = await setup({ format: 'pdf' });
  assert.equal(app.enabledStates.at(-1), false);
  assert.equal(app.all('ReaderFooter').length, 0);
  assert.equal(app.one('LiveToast').enabled, false);
  app.one('PdfReader').onLoad(20);
  app.render();
  assert.equal(app.enabledStates.at(-1), true);
  app.one('PdfReader').onPage(4, 20);
  app.reveal();
  app.byId('reader-close').onPress();
  assert.equal(app.book().pdfPage, 4);
  assert.equal(app.backs(), 1);
});

test('unreadable content leaves accounting paused and permits Android back', async () => {
  const app = await setup({ loadError: true });
  assert.equal(app.enabledStates.at(-1), false);
  assert.equal(app.all('FlashList').length, 0);
  assert.equal(app.one('NavigationBar').hidden, false);
  assert.equal(app.back(), true);
  assert.equal(app.backs(), 1);
});

test('normal reading retains its configured footer', async () => {
  const app = await setup({ pure: false });
  assert.equal(app.all('ReaderFooter').length, 1);
  assert.equal(app.one('LiveToast').enabled, true);
  assert.equal(app.one('NavigationBar').hidden, false);
});

function setupToast(initial = {}) {
  let cursor = 0;
  let now = 0;
  let nextTimer = 0;
  let haptics = 0;
  let queue = [];
  let props = { theme: { id: 'night', statusBar: 'light' }, top: 40, enabled: true, targetMin: 5, sessionSec: 299, ...initial };
  const hooks = [];
  const effects = [];
  const timers = new Map();
  const same = (a, b) => a && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useRef(value) { const slot = cursor++; return hooks[slot] ??= { current: value }; },
    useState(value) { const slot = cursor++; hooks[slot] ??= { value }; return [hooks[slot].value, (next) => { hooks[slot].value = typeof next === 'function' ? next(hooks[slot].value) : next; }]; },
    useEffect(effect, deps) {
      const slot = cursor++;
      if (!same(hooks[slot]?.deps, deps)) effects.push(() => {
        hooks[slot]?.cleanup?.();
        hooks[slot] = { deps, cleanup: effect() };
      });
    },
  };
  const jsx = (type, childProps) => ({ type, props: childProps });
  const imports = {
    react: { ...react, default: react },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native-reanimated': { default: { View: 'AnimatedView' }, FadeInUp: { duration() {} }, FadeOutUp: { duration() {} } },
    '@/components/mascot/miga': { Miga: 'Miga' },
    '@/components/kit': { haptic: () => haptics++, Txt: 'Txt' },
    '@/store/game': { useGame: (select) => select({ queue }) },
    '@/i18n': { tx: (es) => es },
  };
  const exports = {};
  const source = ts.transpileModule(readFileSync(path.join(__dirname, '../src/components/reader/live-toast.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require: (id) => { assert.ok(id in imports, `Unexpected import: ${id}`); return imports[id]; },
    setTimeout: (callback, delay) => { timers.set(++nextTimer, { callback, at: now + delay }); return nextTimer; },
    clearTimeout: (id) => timers.delete(id),
  });
  let tree;
  const render = () => {
    // A second render commits state changes made by an effect or during render.
    for (let pass = 0; pass < 2; pass++) {
      cursor = 0;
      tree = exports.LiveToast(props);
      while (effects.length) effects.shift()();
    }
    return tree;
  };
  render();
  return {
    update(patch) { props = { ...props, ...patch }; return render(); },
    advance(ms) {
      now += ms;
      for (const [id, timer] of Array.from(timers)) if (timer.at <= now) { timers.delete(id); timer.callback(); }
      return render();
    },
    celebrate(item) { queue = [...queue, item]; return render(); },
    tree: () => tree,
    haptics: () => haptics,
  };
}

test('a chosen reading time produces one passive acknowledgement without stopping reading', () => {
  const app = setupToast();
  assert.equal(app.tree(), null);
  const toast = app.update({ sessionSec: 300 });
  assert.equal(toast.props.testID, 'reader-target-toast');
  assert.equal(toast.props.pointerEvents, 'none');
  assert.match(JSON.stringify(toast), /5 minutos leyendo/);
  assert.equal(app.haptics(), 0);
  app.advance(1000);
  assert.equal(app.update({ sessionSec: 301 }).props.testID, 'reader-target-toast');
  assert.equal(app.advance(2200), null);
  assert.equal(app.update({ sessionSec: 900 }), null);
  assert.equal(app.update({ sessionSec: 1801 }), null);
});

test('a target crossed as an overlay or background opens appears once on returning to reading', () => {
  const app = setupToast({ enabled: false, targetEnabled: false });
  assert.equal(app.update({ sessionSec: 300 }), null);
  assert.equal(app.update({ targetEnabled: true, sessionSec: 300 }).props.testID, 'reader-target-toast');
  assert.equal(app.advance(3200), null);
  assert.equal(app.update({ sessionSec: 900 }), null);
  assert.equal(app.haptics(), 0);
});

test('a simultaneous quest reward preserves the passive target acknowledgement without replaying the reward', () => {
  const app = setupToast();
  assert.equal(app.update({ sessionSec: 300 }).props.testID, 'reader-target-toast');
  const reward = { id: 'min30', kind: 'quest', title: 'Read 30 minutes', subtitle: 'Beat your daily goal', big: '1' };
  assert.equal(app.celebrate(reward).props.testID, 'reader-target-toast');
  assert.equal(app.haptics(), 0);
  assert.equal(app.advance(3200), null);
  assert.equal(app.update({ sessionSec: 304 }), null);
  assert.equal(app.haptics(), 0);
  assert.equal(app.celebrate({ ...reward, id: 'later-chapter' }).props.testID, 'reader-live-toast');
  assert.equal(app.haptics(), 1);
});

test('disabling reminders immediately clears a visible target without replaying it', () => {
  const app = setupToast();
  assert.equal(app.update({ sessionSec: 300 }).props.testID, 'reader-target-toast');
  assert.equal(app.update({ enabled: false }), null);
  assert.equal(app.update({ enabled: true }), null);
  assert.equal(app.advance(5000), null);
});

test('rewards earned while toasts are disabled are not deferred until controls return', () => {
  const app = setupToast({ enabled: false, targetMin: null });
  assert.equal(app.celebrate({ id: 'reward', kind: 'achievement', title: 'Read a chapter', subtitle: 'A first chapter', big: '1' }), null);
  assert.equal(app.update({ enabled: true }), null);
  assert.equal(app.haptics(), 0);
});

test('ordinary untimed reading has no target prompt and retains existing reward toasts', () => {
  const app = setupToast({ targetMin: null, sessionSec: 1800 });
  assert.equal(app.tree(), null);
  assert.equal(app.celebrate({ id: 'reward', kind: 'achievement', title: 'Read a chapter', subtitle: 'A first chapter', big: '1' }).props.testID, 'reader-live-toast');
  assert.equal(app.haptics(), 1);
  assert.equal(app.advance(3200), null);
});

// A chosen reminder remains visible independently of the optional reward UI.
test('a chosen reminder works in pure text mode using elapsed foreground reading time', async () => {
  const app = await setup({ pure: true, seconds: 300 });
  const toast = app.one('LiveToast');
  assert.equal(toast.enabled, false);
  assert.equal(toast.targetEnabled, true);
  assert.equal(toast.sessionSec, 300);
  assert.equal(app.tracker.sessionSec, 0);
});

test('explicit reminders appear once while pure text still suppresses rewards', () => {
  const app = setupToast({ enabled: false, targetEnabled: true });
  assert.equal(app.update({ sessionSec: 300 }).props.testID, 'reader-target-toast');
  app.celebrate({ id: 'reward', kind: 'achievement', title: 'Read a chapter', subtitle: 'A first chapter', big: '1' });
  assert.equal(app.advance(3200), null);
  assert.equal(app.update({ enabled: true, sessionSec: 900 }), null);
  assert.equal(app.haptics(), 0);
});

test('an untimed reader never receives a session target', async () => {
  const app = await setup({ targetMin: null });
  assert.equal(app.one('LiveToast').targetMin, null);
});

test('an explicit reminder is hidden while the app is in the background', async () => {
  const app = await setup({ seconds: 300 });
  app.tracker.isForeground = false;
  app.render();
  assert.equal(app.one('LiveToast').targetEnabled, false);
  app.tracker.isForeground = true;
  app.render();
  assert.equal(app.one('LiveToast').targetEnabled, true);
});
