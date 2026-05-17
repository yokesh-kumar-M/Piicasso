/**
 * wordgen — build a candidate wordlist from a key=value profile.
 *
 * Mirrors `generateWordlist(profile, limit)` exactly. Prints one candidate
 * per line so the output can be piped to a cracker.
 */
'use strict';

const { generateWordlist } = require('../engine/pii');
const { err, dim } = require('../ui/theme');

function parseProfile(pairs) {
  const profile = {};
  for (const raw of pairs || []) {
    const idx = raw.indexOf('=');
    if (idx <= 0) continue;
    const k = raw.slice(0, idx).trim();
    const v = raw.slice(idx + 1).trim();
    if (k) profile[k] = v;
  }
  return profile;
}

function run({ profile, limit, json }) {
  const prof = parseProfile(profile);
  if (Object.keys(prof).length === 0) {
    console.error(err('error: at least one --profile key=value pair is required'));
    process.exit(1);
  }
  const n = Number.isFinite(limit) && limit > 0 ? limit : 40;
  const words = generateWordlist(prof, n);
  if (json) {
    console.log(JSON.stringify(words, null, 2));
    return;
  }
  if (!words.length) {
    console.log(dim('no candidates generated.'));
    return;
  }
  for (const w of words) console.log(w);
}

module.exports = { run };
