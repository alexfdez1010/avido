const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const exportsUnderTest = {};
const source = ts.transpileModule(readFileSync(path.join(__dirname, '../src/lib/reading-plan.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(source, { exports: exportsUnderTest });
const { parseSessionTarget, SESSION_TARGETS, DEFAULT_SESSION_TARGET } = exportsUnderTest;

test('session links accept only an explicit supported duration', () => {
  for (const target of [5, 15, 30]) assert.equal(parseSessionTarget(String(target)), target);
  for (const value of [undefined, null, '', '0', '1', '10', '20', '-5', '5.0', '05', ' 5', '5 ', '5min', 'Infinity', 'NaN', [], ['5'], ['5', '15'], 5]) {
    assert.equal(parseSessionTarget(value), null, `Unexpected session target: ${JSON.stringify(value)}`);
  }
});

test('untimed reading is the default alongside optional timed starts', () => {
  assert.deepEqual(Array.from(SESSION_TARGETS), [5, 15, 30]);
  assert.equal(DEFAULT_SESSION_TARGET, null);
});
