const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the production scheduler without a device or notification permissions.
function load(file, imports, DateImpl = Date) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, Date: DateImpl, require: (id) => {
    assert.ok(id in imports, `Unexpected import: ${id}`);
    return imports[id];
  } });
  return exports;
}

const i18n = { tx: (es) => es };
const companion = load('src/lib/companion.ts', { '@/i18n': i18n });
function setup({ platform = 'android', enabled = true, granted = true, met = false, seconds = 601 } = {}) {
  const scheduled = [];
  let permissionCalls = 0;
  const now = new Date(2026, 8, 29, 12).getTime();
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const notifications = {
    setNotificationHandler() {},
    setNotificationChannelAsync: async () => {},
    cancelAllScheduledNotificationsAsync: async () => {},
    getPermissionsAsync: async () => { permissionCalls++; return { granted }; },
    requestPermissionsAsync: async () => ({ granted }),
    scheduleNotificationAsync: async (request) => scheduled.push(request),
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
  };
  const scheduler = load('src/lib/notifications.ts', {
    'expo-notifications': notifications,
    'react-native': { Platform: { OS: platform } },
    '@/store/game': { computeStreak: () => 2, useGame: { getState: () => ({ days: { today: { sec: seconds, goalMet: met } } }) } },
    '@/store/library': { useLibrary: { getState: () => ({ books: { a: { title: 'El faro', lastOpenedAt: 1 } } }) } },
    '@/store/settings': { useSettings: { getState: () => ({ reminders: enabled, reminderHour: 21, dailyGoalMin: 20, onboarded: true }) } },
    './dates': { dayKey: () => 'today' },
    './companion': companion,
    '@/i18n': i18n,
  }, Clock);
  return { ...scheduler, scheduled, permissionCalls: () => permissionCalls };
}

test('today uses remaining minutes; future reminders use the full goal', async () => {
  const app = setup();
  await app.scheduleReminders();
  assert.equal(app.scheduled.length, 4);
  assert.match(app.scheduled[0].content.body, /10 min/);
  assert.match(app.scheduled[1].content.body, /20 min/);
  assert.match(app.scheduled[2].content.body, /20 min/);
  assert.match(app.scheduled[3].content.body, /10 min/);
  assert.ok(app.scheduled.every((n) => n.content.title.startsWith('Miga ·')));
  assert.equal(app.scheduled[0].trigger.channelId, 'reminders');
});

test('a completed goal suppresses both reminders for today', async () => {
  const app = setup({ met: true, seconds: 1200 });
  await app.scheduleReminders();
  assert.equal(app.scheduled.length, 2);
  assert.ok(app.scheduled.every((n) => n.trigger.date.getTime() > new Date(2026, 8, 30).getTime()));
});

for (const [name, options] of Object.entries({ disabled: { enabled: false }, denied: { granted: false }, web: { platform: 'web' } })) {
  test(`${name} does not schedule notifications`, async () => {
    const app = setup(options);
    await app.scheduleReminders();
    assert.equal(app.scheduled.length, 0);
    if (name !== 'denied') assert.equal(app.permissionCalls(), 0);
  });
}

test('web permission request returns without calling native APIs', async () => {
  const app = setup({ platform: 'web' });
  assert.equal(await app.ensurePermission(), false);
  assert.equal(app.permissionCalls(), 0);
});
