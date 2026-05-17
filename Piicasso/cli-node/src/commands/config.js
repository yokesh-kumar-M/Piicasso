/**
 * config — read/write keys in ~/.piicasso/config.json.
 *
 * Sensitive keys (access, refresh) are masked on `get` to keep tokens from
 * leaking into terminal scrollback when users share screenshots.
 */
'use strict';

const store = require('../config/store');
const { ok, err, dim, out, label } = require('../ui/theme');

const SENSITIVE = new Set(['access', 'refresh']);

function mask(v) {
  if (typeof v !== 'string') return v;
  if (v.length <= 8) return '***';
  return v.slice(0, 4) + '…' + v.slice(-4);
}

function run({ action, key, value }) {
  const cfg = store.read();
  const a = (action || 'list').toLowerCase();

  if (a === 'list' || (a === 'get' && !key)) {
    const keys = Object.keys(cfg);
    if (!keys.length) {
      console.log(dim('config is empty. Try `piicasso config set api <url>` or `piicasso login`.'));
      console.log(dim('path: ' + store.configPath()));
      return;
    }
    console.log(label('config:'));
    for (const k of keys) {
      const v = SENSITIVE.has(k) ? mask(cfg[k]) : (typeof cfg[k] === 'object' ? JSON.stringify(cfg[k]) : cfg[k]);
      console.log(`  ${k} = ${out(String(v))}`);
    }
    console.log(dim('path: ' + store.configPath()));
    console.log(dim('api : ' + store.apiBase()));
    return;
  }

  if (a === 'get') {
    if (!(key in cfg)) {
      console.error(err(`error: key not set: ${key}`));
      process.exit(1);
    }
    const v = SENSITIVE.has(key) ? mask(cfg[key]) : cfg[key];
    console.log(typeof v === 'object' ? JSON.stringify(v) : String(v));
    return;
  }

  if (a === 'set') {
    if (!key) {
      console.error(err('error: usage: piicasso config set <key> <value>'));
      process.exit(1);
    }
    if (value === undefined) {
      console.error(err('error: missing value for ' + key));
      process.exit(1);
    }
    store.update({ [key]: value });
    console.log(ok(`set ${key} = ${value}`));
    return;
  }

  if (a === 'unset' || a === 'delete' || a === 'rm') {
    if (!key) {
      console.error(err('error: usage: piicasso config unset <key>'));
      process.exit(1);
    }
    const next = { ...cfg };
    delete next[key];
    store.write(next);
    console.log(ok(`unset ${key}`));
    return;
  }

  console.error(err(`error: unknown action "${action}". use get|set|unset|list`));
  process.exit(1);
}

module.exports = { run };
