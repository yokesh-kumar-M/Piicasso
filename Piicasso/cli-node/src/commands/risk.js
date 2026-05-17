/**
 * risk — POST /api/operations/financial-risk/ with a target identifier.
 */
'use strict';

const api = require('../api/client');
const { ok, err, dim, label, out } = require('../ui/theme');

async function run({ target, json }) {
  if (!target) {
    console.error(err('error: usage: piicasso risk <target>'));
    process.exit(1);
  }
  const data = await api.call({ method: 'POST', url: 'operations/financial-risk/', data: { target } });
  if (json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  if (!data) {
    console.log(dim('no data.'));
    return;
  }
  console.log(label(`financial-risk for "${target}"`));
  if (typeof data.score === 'number' || typeof data.risk_score === 'number') {
    const score = data.score != null ? data.score : data.risk_score;
    console.log(ok(`score: ${score}`));
  }
  if (data.summary) console.log(out(String(data.summary)));
  if (Array.isArray(data.signals)) {
    console.log(dim(`signals (${data.signals.length}):`));
    for (const s of data.signals) {
      console.log(dim('  - ') + out(typeof s === 'string' ? s : JSON.stringify(s)));
    }
  } else if (!('score' in data) && !('risk_score' in data)) {
    console.log(JSON.stringify(data, null, 2));
  }
}

module.exports = { run };
