const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

for (const workflow of ['release-apk.yml', 'play-bundle.yml']) test(`${workflow} recognizes old and current signer output without accepting a different identity`, () => {
  const content = readFileSync(path.join(__dirname, '..', '.github/workflows', workflow), 'utf8');
  const command = content.split('\n').find((line) => line.trim().startsWith('actual=$(')).trim();
  const expected = readFileSync(path.join(__dirname, '..', '.github/android-signer.sha256'), 'utf8').trim();
  const directory = mkdtempSync(path.join(os.tmpdir(), 'avido-signing-'));
  mkdirSync(path.join(directory, 'dist/play'), { recursive: true });
  const extract = (output) => {
    writeFileSync(path.join(directory, 'apk-signer.txt'), output);
    writeFileSync(path.join(directory, 'dist/play/APK-SIGNER.txt'), output);
    return execFileSync('bash', ['-c', command + '\nprintf "%s" "$actual"'], {
      cwd: directory, env: { ...process.env, RUNNER_TEMP: directory }, encoding: 'utf8',
    });
  };
  try {
    for (const prefix of ['Signer #1', 'Signer #2', 'V1 Signer', 'V2 Signer', 'V3 Signer', 'V3 Signer:']) {
      assert.equal(extract(`${prefix} certificate SHA-256 digest: ${expected.toUpperCase()}\r\n`), expected);
    }
    assert.equal(extract(`V2 Signer certificate SHA-256 digest: ${expected}\nV3 Signer certificate SHA-256 digest: ${expected}\n`), expected);
    assert.notEqual(extract(`Signer #1 certificate SHA-256 digest: ${'0'.repeat(64)}\n`), expected);
    assert.notEqual(extract('Unrecognized certificate output\n'), expected);
    assert.notEqual(extract(`Signer #1 certificate SHA-256 digest: ${expected}\nSigner #2 certificate SHA-256 digest: ${'0'.repeat(64)}\n`), expected);
    assert.match(content, /if \[ "\$actual" != "\$expected" \]; then/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
