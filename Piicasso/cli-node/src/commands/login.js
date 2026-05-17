/**
 * login — prompt for credentials and stash JWT pair in ~/.piicasso/config.json.
 *
 * Uses node's built-in readline so we don't pull in extra deps. Password
 * input is masked by muting stdout, the same trick used by npm itself.
 */
'use strict';

const readline = require('readline');
const { Writable } = require('stream');
const axios = require('axios');
const store = require('../config/store');
const { err, ok, dim, out } = require('../ui/theme');

function ask(question, { mask = false } = {}) {
  return new Promise(resolve => {
    const mutable = new Writable({
      write(chunk, _enc, cb) {
        if (!mask || !mutable._muted) process.stdout.write(chunk);
        cb();
      },
    });
    mutable._muted = false;
    const rl = readline.createInterface({ input: process.stdin, output: mutable, terminal: true });
    rl.question(question, answer => {
      rl.close();
      if (mask) process.stdout.write('\n');
      resolve(answer);
    });
    mutable._muted = mask;
  });
}

async function run() {
  console.log(dim('Sign in to PIIcasso'));
  console.log(dim(`API: ${store.apiBase()}`));
  const identifier = (await ask('email or username: ')).trim();
  const password = await ask('password: ', { mask: true });

  if (!identifier || !password) {
    console.error(err('error: email/username and password are required'));
    process.exit(1);
  }

  // Backend accepts either field, and the email field is the canonical one
  // (see core/views.LoginView). Send both for forward-compat.
  const body = identifier.includes('@')
    ? { email: identifier, password }
    : { username: identifier, password };

  try {
    const res = await axios.post(store.apiBase() + 'user/token/', body, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    const { access, refresh } = res.data || {};
    if (!access) {
      console.error(err('error: login response missing access token'));
      process.exit(1);
    }
    store.update({ access, refresh, user: { identifier } });
    console.log(ok('signed in.'));
    console.log(out('tokens saved to ' + store.configPath()));
  } catch (e) {
    if (e.response) {
      const status = e.response.status;
      const data = e.response.data;
      const detail = (data && (data.detail || data.error)) || JSON.stringify(data || {});
      console.error(err(`error: HTTP ${status} — ${detail}`));
    } else {
      console.error(err(`error: ${e.message}`));
    }
    process.exit(1);
  }
}

module.exports = { run };
