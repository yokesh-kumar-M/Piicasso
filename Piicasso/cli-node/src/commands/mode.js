/**
 * mode — show or set the local mode (controls prompt color + theme).
 *
 * `piicasso mode`              -> print current mode
 * `piicasso mode user`         -> set mode to user
 * `piicasso mode security`     -> set mode to security
 */
'use strict';

const store = require('../config/store');
const { ok, err, dim } = require('../ui/theme');

function run({ value }) {
  if (!value) {
    console.log(dim('current mode: ') + ok(store.getMode()));
    return;
  }
  const next = String(value).toLowerCase();
  if (next !== 'user' && next !== 'security') {
    console.error(err('error: mode must be one of: user, security'));
    process.exit(1);
  }
  store.update({ mode: next });
  console.log(ok(`mode -> ${next}`));
}

module.exports = { run };
