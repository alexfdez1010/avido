const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// Run the real hook against a controllable clock and local-store substitutes.
function setup({ enabled = true, bookExists = true } = {}) {
  let now = 0;
  let cursor = 0;
  let timer;
  let stateListener;
  const hooks = [];
  const effects = [];
  const commits = [];
  const book = { readSeconds: 90, readPages: 4 };
  const appState = {
    currentState: 'active',
    addEventListener: (_event, listener) => {
      stateListener = listener;
      return { remove: () => { stateListener = null; } };
    },
  };
  const same = (a, b) => a && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useRef(value) {
      const slot = cursor++;
      return hooks[slot] ??= { current: value };
    },
    useState(value) {
      const slot = cursor++;
      hooks[slot] ??= { value };
      return [hooks[slot].value, (next) => { hooks[slot].value = next; }];
    },
    useCallback(callback, deps) {
      const slot = cursor++;
      if (!same(hooks[slot]?.deps, deps)) hooks[slot] = { deps, callback };
      return hooks[slot].callback;
    },
    useEffect(effect, deps) {
      const slot = cursor++;
      if (!same(hooks[slot]?.deps, deps)) effects.push(() => {
        hooks[slot]?.cleanup?.();
        hooks[slot] = { deps, cleanup: effect() };
      });
    },
  };
  const imports = {
    react,
    'react-native': { AppState: appState },
    '@/store/game': { useGame: { getState: () => ({ addReading: (...args) => commits.push(args) }) } },
    '@/store/library': { useLibrary: { getState: () => ({
      books: bookExists ? { novel: book } : {},
      updateBook: (id, patch) => { assert.equal(id, 'novel'); Object.assign(book, patch); },
    }) } },
  };
  const exports = {};
  const source = ts.transpileModule(readFileSync(path.join(__dirname, '../src/hooks/use-reading-tracker.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require: (id) => { assert.ok(id in imports, `Unexpected import: ${id}`); return imports[id]; },
    Date: { now: () => now },
    setInterval: (callback, period) => { assert.equal(period, 1000); timer = callback; return 1; },
    clearInterval: () => { timer = null; },
  });
  let currentEnabled = enabled;
  const render = () => {
    cursor = 0;
    const result = exports.useReadingTracker('novel', currentEnabled);
    while (effects.length) effects.shift()();
    return result;
  };
  render();
  return {
    book, commits, render,
    tick(seconds) { for (let i = 0; i < seconds; i++) { now += 1000; timer?.(); } },
    enable(value) { currentEnabled = value; return render(); },
    appState(value) { appState.currentState = value; stateListener?.(value); },
    unmount() { for (const hook of hooks) hook?.cleanup?.(); },
    listening: () => Boolean(stateListener),
  };
}

test('reading time and new pages persist periodically and exactly once on exit', () => {
  const app = setup();
  app.render().addPages(2);
  app.tick(15);
  assert.deepEqual(app.commits, [[15, 2, 15]]);
  assert.deepEqual(app.book, { readSeconds: 105, readPages: 6 });
  app.tick(4);
  app.render().addPages(1);
  app.unmount();
  assert.deepEqual(app.commits, [[15, 2, 15], [4, 1, 19]]);
  assert.deepEqual(app.book, { readSeconds: 109, readPages: 7 });
  assert.equal(app.listening(), false);
  app.tick(10);
  assert.equal(app.commits.length, 2);
});

test('overlays pause the session and closing them resumes the same session', () => {
  const app = setup();
  app.tick(4);
  app.enable(false);
  app.tick(240);
  assert.equal(app.render().sessionSec, 4);
  app.enable(true);
  app.tick(2);
  assert.equal(app.render().sessionSec, 6);
  app.unmount();
  assert.deepEqual(app.commits, [[6, 0, 6]]);
});

test('backgrounding saves pending work and ignores time outside the reader', () => {
  const app = setup();
  app.tick(7);
  app.render().addPages(1);
  app.appState('background');
  assert.deepEqual(app.commits, [[7, 1, 7]]);
  app.tick(300);
  app.appState('active');
  app.tick(3);
  app.unmount();
  assert.deepEqual(app.commits, [[7, 1, 7], [3, 0, 10]]);
  assert.deepEqual(app.book, { readSeconds: 100, readPages: 5 });
});

test('an inactive reader does not accumulate time before its content is available', () => {
  const app = setup({ enabled: false });
  app.tick(30);
  assert.equal(app.render().sessionSec, 0);
  app.enable(true);
  app.tick(2);
  app.unmount();
  assert.deepEqual(app.commits, [[2, 0, 2]]);
});

test('idle time pauses until a reading interaction, without losing earlier progress', () => {
  const app = setup();
  app.tick(181);
  assert.equal(app.render().sessionSec, 180);
  assert.equal(app.render().idle, true);
  app.tick(60);
  app.render().poke();
  assert.equal(app.render().idle, false);
  app.tick(2);
  app.unmount();
  assert.equal(app.commits.reduce((total, [seconds]) => total + seconds, 0), 182);
  assert.equal(app.book.readSeconds, 272);
});

test('saving without a remaining library book preserves the reading log', () => {
  const app = setup({ bookExists: false });
  app.tick(3);
  app.render().addPages(2);
  app.unmount();
  assert.deepEqual(app.commits, [[3, 2, 3]]);
});
