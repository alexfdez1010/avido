const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}, DateImpl = Date) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, Date: DateImpl, require(id) {
    assert.ok(id in imports, `Unexpected import: ${id}`);
    return imports[id];
  } });
  return exports;
}
const api = load('src/lib/daily-goals.ts');
const weeklyGoalMin = [5, 10, 15, 20, 25, 30, 180];

for (let day = 0; day < 7; day++) test(`local weekday ${day} selects only its own goal`, () => {
  const date = new Date(2026, 10, 1 + day, 12);
  const settings = { dailyGoalMin: 35, weeklyGoalsEnabled: true, weeklyGoalMin };
  assert.equal(date.getDay(), day);
  assert.equal(api.dailyGoalForDate(settings, date), weeklyGoalMin[day]);
  assert.equal(api.dailyGoalForDate({ ...settings, weeklyGoalsEnabled: false }, date), 35);
  assert.equal(api.dailyGoalForDate({ dailyGoalMin: 35 }, date), 35);
});

test('goals follow local midnight and the Sunday to Monday boundary', () => {
  const settings = { dailyGoalMin: 35, weeklyGoalsEnabled: true, weeklyGoalMin };
  assert.equal(api.dailyGoalForDate(settings, new Date(2026, 10, 1, 23, 59, 59)), 5);
  assert.equal(api.dailyGoalForDate(settings, new Date(2026, 10, 2, 0, 0, 0)), 10);
});

test('a new weekly plan starts from the current daily goal without sharing arrays', () => {
  const first = api.uniformWeekGoal(35);
  const second = api.uniformWeekGoal(35);
  assert.deepEqual(Array.from(first), [35,35,35,35,35,35,35]);
  first[1] = 40;
  assert.equal(second[1], 35);
});

for (const value of [null, undefined, [], [5], [5,10,15,20,25,30,181], [5,10,15,20,25,30,0], [5,10,15,20,25,30,5.5], [5,10,15,20,25,30,'20']]) test(`invalid persisted schedule falls back safely: ${JSON.stringify(value)}`, () => {
  assert.equal(api.isWeekGoals(value), false);
  assert.equal(api.dailyGoalForDate({ dailyGoalMin: 35, weeklyGoalsEnabled: true, weeklyGoalMin: value }), 35);
});

function storeFactory() {
  return (init) => {
    let state;
    const set = (patch) => { state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }; };
    state = init(set, () => state);
    return { getState: () => state, setState: set };
  };
}

test('settings hydrate old profiles and preserve enabled or disabled weekly plans', () => {
  let options;
  const { useSettings } = load('src/store/settings.ts', {
    zustand: { create: storeFactory },
    'react-native': { Platform: { OS: 'web' } },
    'zustand/middleware': { persist: (init, opts) => { options = opts; return init; } },
    './storage': { jsonStorage: {} },
    '@/lib/daily-goals': api,
  });
  const current = useSettings.getState();
  const old = options.merge({ dailyGoalMin: 45 }, current);
  assert.equal(old.dailyGoalMin, 45);
  assert.equal(old.weeklyGoalsEnabled, false);
  assert.equal(old.weeklyGoalMin, null);
  for (const enabled of [true, false]) {
    const saved = options.merge({ weeklyGoalsEnabled: enabled, weeklyGoalMin }, current);
    assert.equal(saved.weeklyGoalsEnabled, enabled);
    assert.deepEqual(Array.from(saved.weeklyGoalMin), weeklyGoalMin);
  }
  const broken = options.merge({ weeklyGoalsEnabled: true, weeklyGoalMin: [0] }, current);
  assert.equal(broken.weeklyGoalsEnabled, false);
  assert.equal(broken.weeklyGoalMin, null);
});

for (let weekday = 0; weekday < 7; weekday++) test(`rewards and quests use weekday ${weekday}'s threshold once`, () => {
  const now = new Date(2026, 10, 1 + weekday, 12).getTime();
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const settings = { dailyGoalMin: 60, weeklyGoalsEnabled: true, weeklyGoalMin };
  const questGoals = [];
  const emptyDay = () => ({ sec: 0, pages: 0, xp: 0, sessions: 0, longest: 0, newBooks: 0, chapters: 0, quests: [] });
  const goalApi = load('src/lib/daily-goals.ts', {}, Clock);
  const game = load('src/store/game.ts', {
    zustand: { create: storeFactory },
    'zustand/middleware': { persist: (init) => init },
    '@/game/achievements': { ACHIEVEMENTS: [] },
    '@/game/levels': { levelFromXp: () => 1, levelTitle: () => 'Reader', streakMultiplier: () => 1 },
    '@/game/quests': { questsForDay: (_key, goal) => { questGoals.push(goal); return []; } },
    '@/game/types': { emptyDay },
    '@/lib/dates': { dayKey: (date = new Clock()) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`, addDays: (date, n) => new Clock(date.getFullYear(), date.getMonth(), date.getDate() + n), parseDayKey() {} },
    '@/lib/daily-goals': goalApi,
    './library': { useLibrary: { getState: () => ({ books: {} }) } },
    './settings': { useSettings: { getState: () => settings } },
    './storage': { jsonStorage: {} },
    '@/i18n': { tx: (es, en) => en, isEs: false },
  }, Clock).useGame;
  const target = weeklyGoalMin[weekday] * 60;
  game.getState().addReading(target - 1, 0, target - 1);
  assert.equal(game.getState().goalsMet, 0);
  game.getState().addReading(1, 0, target);
  assert.equal(game.getState().goalsMet, 1);
  assert.equal(game.getState().queue.filter((c) => c.kind === 'goal').length, 1);
  assert.ok(questGoals.every((goal) => goal === weeklyGoalMin[weekday]));
  settings.weeklyGoalMin = [...weeklyGoalMin];
  settings.weeklyGoalMin[weekday] = 180;
  game.getState().addReading(60, 0, target + 60);
  assert.equal(game.getState().goalsMet, 1, 'Editing goals cannot revoke or duplicate a completed day');
});
