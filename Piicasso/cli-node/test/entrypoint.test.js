'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('importing the package entry module has no CLI or REPL side effects', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const result = spawnSync(
    process.execPath,
    ['-e', "require('./src/index'); process.stdout.write('loaded')"],
    { cwd: projectRoot, encoding: 'utf8', timeout: 3000 },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'loaded');
});
