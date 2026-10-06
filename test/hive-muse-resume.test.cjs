'use strict';

// Muse resume guard: only splice `muse resume <id>` when the retained log exists.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const loadTs = require('./load-ts.cjs');

const { HiveManager } = loadTs('src/main/hive.ts');
const hive = new HiveManager(() => fs.mkdtempSync(path.join(os.tmpdir(), 'mdh-home-')));

const SID = '01a10e72-dd10-7231-8099-fad36454dc94';

function makeStore() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mdh-muse-sessions-'));
  const dir = path.join(root, '2026', '10', '06', SID);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'session.jsonl'), '{}\n');
  return root;
}

test('finds a retained dated session log', () => {
  assert.equal(hive.museSessionExists(SID, makeStore()), true);
});

test('unknown id reads as missing (fresh spawn, never a poison resume)', () => {
  assert.equal(hive.museSessionExists('00000000-0000-0000-0000-000000000000', makeStore()), false);
});

test('malformed refs never reach the filesystem as paths', () => {
  const root = makeStore();
  for (const bad of ['', 'x', '../../etc', 'my session', '01a10e72!bad']) {
    assert.equal(hive.museSessionExists(bad, root), false);
  }
});

test('missing store root reads as no session', () => {
  assert.equal(hive.museSessionExists(SID, path.join(os.tmpdir(), 'mdh-nope-' + Date.now())), false);
});
