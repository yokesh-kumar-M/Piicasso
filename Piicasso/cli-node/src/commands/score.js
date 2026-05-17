/**
 * score — run the local password scorer against an optional profile.
 *
 * --profile may be passed multiple times as `key=value` pairs to model what
 * an attacker might know about the target.
 */
'use strict';

const { scorePassword } = require('../engine/pii');
const { ok, err, dim, label, out } = require('../ui/theme');

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

function ratingColor(rating) {
  switch (rating) {
    case 'Excellent':
    case 'Strong':
      return ok;
    case 'Moderate':
      return label;
    default:
      return err;
  }
}

function run({ password, profile, json }) {
  if (!password) {
    console.error(err('error: password is required'));
    process.exit(1);
  }
  const prof = parseProfile(profile);
  const result = scorePassword(password, prof);
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const colour = ratingColor(result.rating);
  console.log(`${label('score')}   : ${colour(String(result.score))} / 100`);
  console.log(`${label('rating')}  : ${colour(result.rating)}`);
  console.log(`${label('entropy')} : ${out(result.entropy + ' bits')}`);
  console.log(`${label('crack')}   : ${out(result.time)} @ 10B guesses/sec`);
  if (result.reasons.length) {
    console.log(dim('reasons:'));
    for (const r of result.reasons) {
      console.log(dim('  - ') + out(r.label) + dim(` (${r.kind})`));
    }
  }
}

module.exports = { run };
