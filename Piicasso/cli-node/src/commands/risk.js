/**
 * risk — POST /api/operations/financial-risk/ with a target identifier.
 */
'use strict';

const api = require('../api/client');
const { ok, dim, label, out } = require('../ui/theme');

async function run({ json } = {}) {
  const data = await api.call({ method: 'GET', url: 'operations/financial-risk/' });
  if (json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  if (!data) {
    console.log(dim('no data.'));
    return;
  }
  console.log(label('financial-risk snapshot'));
  if (data.severity) console.log(ok(`severity: ${data.severity}`));
  if (typeof data.total_exposure === 'number') {
    console.log(out(`total exposure: $${data.total_exposure.toLocaleString('en-US')}`));
  }
  if (typeof data.breach_probability === 'number') {
    console.log(out(`breach probability: ${data.breach_probability}%`));
  }
  if (Array.isArray(data.recommendations)) {
    console.log(dim(`recommendations (${data.recommendations.length}):`));
    for (const item of data.recommendations) {
      console.log(dim('  - ') + out(item.title || String(item)));
    }
  }
}

module.exports = { run };
