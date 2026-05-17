/**
 * whoami — print the currently authenticated user, or 'guest' if not signed in.
 *
 * Tries /api/profile/ first for the canonical identity. Falls back to the
 * cached identifier in config if the call fails for non-auth reasons.
 */
'use strict';

const store = require('../config/store');
const api = require('../api/client');
const { dim, ok, err, out } = require('../ui/theme');

async function run() {
  const cfg = store.read();
  if (!cfg.access) {
    console.log(dim('guest (not authenticated)'));
    return;
  }
  try {
    const data = await api.call({ method: 'GET', url: 'profile/' });
    const id = (data && (data.email || data.username)) || (cfg.user && cfg.user.identifier) || 'authenticated';
    const role = data && data.is_superuser ? 'superuser' : 'standard';
    console.log(out(`user: ${id}`));
    console.log(out(`role: ${role}`));
    console.log(dim(`api : ${store.apiBase()}`));
  } catch (e) {
    // api.call exits on failure already; if we ever get here, surface generically
    console.error(err(`error: ${e.message}`));
    process.exit(1);
  }
}

module.exports = { run };
